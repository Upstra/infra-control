import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmwareConnectionService } from '../../domain/services/vmware-connection.service';
import {
  HA_EVENT_PREFIX,
  PowerOffCauseDomainService,
} from '../../domain/services/power-off-cause.domain.service';
import {
  VmPoweredOffEvent,
  VmPoweredOnEvent,
  VmwareTelemetryEvents,
} from '../../domain/events/vmware-telemetry.events';
import {
  PowerOffCause,
  VcenterEvent,
  VcenterEventsCursor,
  VcenterEventsResult,
} from '../../domain/interfaces/vmware-telemetry.interface';
import { VmwareTelemetryCacheService } from '../services/vmware-telemetry-cache.service';
import { UpstraPlanStatusService } from '../services/upstra-plan-status.service';

const MAX_EVENTS = '500';
const SCRIPT_TIMEOUT_MS = 60_000;

export interface CollectVcenterEventsResult {
  processed: number;
  skipped: number;
  cursor: VcenterEventsCursor | null;
}

@Injectable()
export class CollectVcenterEventsUseCase {
  private readonly logger = new Logger(CollectVcenterEventsUseCase.name);

  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly connectionService: VmwareConnectionService,
    private readonly causeService: PowerOffCauseDomainService,
    private readonly cache: VmwareTelemetryCacheService,
    private readonly planStatus: UpstraPlanStatusService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<CollectVcenterEventsResult | null> {
    const vcenter =
      await this.serverRepository.findServerByTypeWithCredentials('vcenter');
    if (!vcenter) return null;

    const cursor = await this.cache.getEventsCursor();
    const connection = this.connectionService.buildVmwareConnection(vcenter);
    const args = [
      ...this.connectionService.buildConnectionArgs(connection),
      '--max',
      MAX_EVENTS,
      ...(cursor ? ['--since', cursor.createdAt] : []),
    ];
    const result: VcenterEventsResult = await this.pythonExecutor.executePython(
      'vcenter_events.sh',
      args,
      { timeout: SCRIPT_TIMEOUT_MS },
    );
    if (!result || !Array.isArray(result.events)) {
      throw new Error('Invalid vcenter_events output');
    }

    const fresh = result.events.filter(
      (event) => !this.alreadySeen(event, cursor),
    );
    const serviceAccounts = [
      vcenter.login,
      this.configService.get<string>('VMWARE_SERVICE_ACCOUNT'),
    ].filter((account): account is string => !!account);
    const upstraPlanActive = await this.planStatus.isActive();

    for (const event of fresh) {
      await this.handle(event, fresh, serviceAccounts, upstraPlanActive);
    }

    const nextCursor = this.nextCursor(cursor, fresh, result.until);
    await this.cache.setEventsCursor(nextCursor);
    return {
      processed: fresh.length,
      skipped: result.events.length - fresh.length,
      cursor: nextCursor,
    };
  }

  private async handle(
    event: VcenterEvent,
    batch: VcenterEvent[],
    serviceAccounts: string[],
    upstraPlanActive: boolean,
  ): Promise<void> {
    if (!event.vmMoid) return;

    if (event.type.startsWith(HA_EVENT_PREFIX)) {
      await this.cache.markHaSeen(event.vmMoid, event.createdAt);
      await this.upgradeToHa(event);
      return;
    }

    if (event.type === 'VmPoweredOnEvent') {
      await this.cache.clearPowerOff(event.vmMoid);
      const poweredOn: VmPoweredOnEvent = {
        moid: event.vmMoid,
        name: event.vmName,
        at: event.createdAt,
      };
      this.eventEmitter.emit(VmwareTelemetryEvents.VM_POWERED_ON, poweredOn);
      return;
    }

    if (event.type !== 'VmPoweredOffEvent') return;

    const haSeenAt = await this.cache.getHaSeen(event.vmMoid);
    const neighbours = haSeenAt
      ? [...batch, this.syntheticHaEvent(event, haSeenAt)]
      : batch;
    const cause = this.causeService.determine(event, {
      neighbours,
      serviceAccounts,
      upstraPlanActive,
    });
    await this.recordPowerOff(event, cause);
  }

  private async upgradeToHa(haEvent: VcenterEvent): Promise<void> {
    const existing = await this.cache.getPowerOff(haEvent.vmMoid!);
    if (!existing || existing.cause === 'ha') return;
    const poweredOff = { ...haEvent, createdAt: existing.at };
    if (!this.causeService.isNeighbour(poweredOff, haEvent)) return;
    await this.recordPowerOff(poweredOff, {
      at: existing.at,
      cause: 'ha',
      by: null,
    });
  }

  private async recordPowerOff(
    event: VcenterEvent,
    cause: PowerOffCause,
  ): Promise<void> {
    await this.cache.setPowerOff(event.vmMoid!, cause);
    const poweredOff: VmPoweredOffEvent = {
      moid: event.vmMoid!,
      name: event.vmName,
      hostMoid: event.hostMoid,
      powerOff: cause,
    };
    this.logger.log(
      `VM ${event.vmName ?? event.vmMoid} powered off (${cause.cause}${cause.by ? ` by ${cause.by}` : ''})`,
    );
    this.eventEmitter.emit(VmwareTelemetryEvents.VM_POWERED_OFF, poweredOff);
  }

  private syntheticHaEvent(event: VcenterEvent, at: string): VcenterEvent {
    return {
      ...event,
      key: -1,
      type: `${HA_EVENT_PREFIX}seen`,
      createdAt: at,
    };
  }

  private alreadySeen(
    event: VcenterEvent,
    cursor: VcenterEventsCursor | null,
  ): boolean {
    if (!cursor) return false;
    const eventTime = new Date(event.createdAt).getTime();
    const cursorTime = new Date(cursor.createdAt).getTime();
    if (eventTime < cursorTime) return true;
    return eventTime === cursorTime && cursor.keys.includes(event.key);
  }

  private nextCursor(
    cursor: VcenterEventsCursor | null,
    fresh: VcenterEvent[],
    until: string,
  ): VcenterEventsCursor {
    if (fresh.length === 0) {
      return cursor ?? { createdAt: until, keys: [] };
    }
    const latest = fresh.reduce((max, event) =>
      new Date(event.createdAt).getTime() > new Date(max.createdAt).getTime()
        ? event
        : max,
    );
    const latestTime = new Date(latest.createdAt).getTime();
    const keys = fresh
      .filter((event) => new Date(event.createdAt).getTime() === latestTime)
      .map((event) => event.key);
    const carried =
      cursor && new Date(cursor.createdAt).getTime() === latestTime
        ? cursor.keys
        : [];
    return {
      createdAt: latest.createdAt,
      keys: Array.from(new Set([...carried, ...keys])),
    };
  }
}
