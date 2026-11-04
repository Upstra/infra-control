import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import {
  UpsBatteryAlertEvent,
  UpsBatteryEvents,
  UpsCheckFailedEvent,
  UpsStatusChangedEvent,
} from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsNotFoundException } from '../../domain/exceptions/ups.exception';
import { UpsBatteryDomainService } from '../../domain/services/ups-battery.domain.service';
import { parseUpsTelemetry } from '../../domain/services/ups-telemetry.parser';
import { UpsBatteryCacheService } from '../services/ups-battery-cache.service';
import { Ups } from '../../domain/entities/ups.entity';

export interface GetUpsBatteryOptions {
  forceRefresh?: boolean;
}

@Injectable()
export class GetUpsBatteryUseCase {
  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    private readonly eventEmitter: EventEmitter2,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsBatteryDomainService: UpsBatteryDomainService,
    private readonly upsBatteryCacheService: UpsBatteryCacheService,
  ) {}

  async execute(
    upsId: string,
    options: GetUpsBatteryOptions = {},
  ): Promise<UPSBatteryStatusDto> {
    const previous = await this.upsBatteryCacheService.get(upsId);
    if (previous && !options.forceRefresh) {
      return previous;
    }

    const ups = await this.upsRepository.findUpsById(upsId);
    if (!ups) {
      throw new UpsNotFoundException(upsId);
    }

    let status: UPSBatteryStatusDto;
    try {
      status = await this.readStatus(ups);
    } catch (error) {
      const failure: UpsCheckFailedEvent = {
        upsId: ups.id,
        upsName: ups.name,
        ip: ups.ip,
        error: error?.message ?? 'Unknown error',
        at: new Date(),
      };
      this.eventEmitter.emit(UpsBatteryEvents.CHECK_FAILED, failure);
      throw error;
    }
    status.roomId = ups.roomId ?? null;
    await this.upsBatteryCacheService.set(ups.id, status);
    this.emitTransitions(ups, previous, status);
    this.eventEmitter.emit(UpsBatteryEvents.BATTERY_CHECKED, status);

    return status;
  }

  private async readStatus(ups: Ups): Promise<UPSBatteryStatusDto> {
    let result: unknown;
    try {
      result = await this.pythonExecutor.executePython('ups_battery.sh', [
        '--ip',
        ups.ip,
        '--format',
        'json',
      ]);
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to get battery status',
      );
    }

    const parsed = parseUpsTelemetry(result);
    if (!parsed) {
      throw new BadRequestException(
        'Invalid response format from battery script',
      );
    }

    if (parsed.kind === 'minutes') {
      return this.upsBatteryDomainService.enrichBatteryStatus(
        ups.id,
        ups.ip,
        parsed.minutes,
        null,
        ups.name,
      );
    }

    return this.upsBatteryDomainService.enrichBatteryStatus(
      ups.id,
      ups.ip,
      null,
      parsed.telemetry,
      ups.name,
    );
  }

  private emitTransitions(
    ups: Ups,
    previous: UPSBatteryStatusDto | null,
    current: UPSBatteryStatusDto,
  ): void {
    const previousOnBattery = previous?.onBattery ?? null;
    if (current.onBattery !== null && previousOnBattery !== current.onBattery) {
      const event: UpsStatusChangedEvent = {
        upsId: ups.id,
        upsName: ups.name,
        previous: previousOnBattery,
        current: current.onBattery,
        at: current.timestamp,
        status: current,
      };
      this.eventEmitter.emit(UpsBatteryEvents.STATUS_CHANGED, event);
    }

    const previousLevel = previous?.alertLevel ?? null;
    if (
      current.alertLevel === 'normal' ||
      previousLevel === current.alertLevel
    ) {
      return;
    }

    const alert: UpsBatteryAlertEvent = {
      upsId: ups.id,
      upsName: ups.name,
      previousAlertLevel: previousLevel,
      status: {
        ip: ups.ip,
        minutesRemaining: current.minutesRemaining,
        alertLevel: current.alertLevel,
        statusLabel: current.statusLabel,
        timestamp: current.timestamp,
      },
    };
    this.eventEmitter.emit(UpsBatteryEvents.BATTERY_ALERT, alert);
  }
}
