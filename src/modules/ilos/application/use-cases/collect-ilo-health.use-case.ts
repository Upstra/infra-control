import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { parseIloHealth } from '../../domain/services/ilo-health.parser';
import {
  IloHealthCheckedEvent,
  IloHealthEvents,
  IloHealthUnreachableEvent,
} from '../../domain/events/ilo-health.events';
import { IloHealth } from '../../domain/interfaces/ilo-health.interface';
import { IloHealthCacheService } from '../services/ilo-health-cache.service';

export const ILO_UNREACHABLE_THRESHOLD = 3;
const DEFAULT_INTERVAL_SECONDS = 120;
const SCRIPT_TIMEOUT_SECONDS = 15;

@Injectable()
export class CollectIloHealthUseCase {
  constructor(
    private readonly pythonExecutor: PythonExecutorService,
    private readonly cache: IloHealthCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  intervalSeconds(): number {
    return Number(
      this.configService.get('ILO_HEALTH_INTERVAL_SECONDS') ??
        DEFAULT_INTERVAL_SECONDS,
    );
  }

  async execute(server: Server): Promise<IloHealth | null> {
    if (!server.ilo) return null;
    try {
      const raw = await this.pythonExecutor.executePython(
        'ilo_health.sh',
        [
          '--ip',
          server.ilo.ip,
          '--user',
          server.ilo.login,
          '--password',
          server.ilo.password,
          '--timeout',
          String(SCRIPT_TIMEOUT_SECONDS),
        ],
        { timeout: (SCRIPT_TIMEOUT_SECONDS * 4 + 10) * 1000 },
      );
      const health = parseIloHealth(raw);
      if (!health) throw new Error('Invalid ilo_health output');

      await this.cache.set(server.id, health, this.intervalSeconds() * 3);
      await this.cache.resetFailures(server.id);
      const event: IloHealthCheckedEvent = {
        serverId: server.id,
        serverName: server.name,
        roomId: server.roomId ?? null,
        room: server.room
          ? {
              inletWarnC: server.room.inletWarnC,
              inletCritC: server.room.inletCritC,
            }
          : null,
        health,
      };
      this.eventEmitter.emit(IloHealthEvents.CHECKED, event);
      return health;
    } catch (error) {
      const failures = await this.cache.recordFailure(server.id);
      if (failures >= ILO_UNREACHABLE_THRESHOLD) {
        const event: IloHealthUnreachableEvent = {
          serverId: server.id,
          serverName: server.name,
          iloIp: server.ilo.ip,
          failures,
          error: error?.message ?? 'Unknown error',
        };
        this.eventEmitter.emit(IloHealthEvents.UNREACHABLE, event);
      }
      throw error;
    }
  }
}
