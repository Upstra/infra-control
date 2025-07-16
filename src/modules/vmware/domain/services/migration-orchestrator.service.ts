import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import {
  IMigrationOrchestrator,
  MigrationState,
  MigrationStatus,
  MigrationEvent,
} from '../interfaces/migration-orchestrator.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';

@Injectable()
export class MigrationOrchestratorService implements IMigrationOrchestrator {
  private readonly logger = new Logger(MigrationOrchestratorService.name);
  private readonly REDIS_STATE_KEY = 'migration:state';
  private readonly REDIS_EVENTS_KEY = 'migration:events';
  private readonly REDIS_CURRENT_OP_KEY = 'migration:current_operation';
  private readonly REDIS_START_TIME_KEY = 'migration:start_time';
  private readonly REDIS_END_TIME_KEY = 'migration:end_time';
  private readonly REDIS_ERROR_KEY = 'migration:error';

  constructor(
    private readonly redis: RedisSafeService,
    private readonly pythonExecutor: PythonExecutorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async executeMigrationPlan(planPath: string): Promise<void> {
    const currentState = await this.getState();
    if (
      currentState !== MigrationState.IDLE &&
      currentState !== MigrationState.FAILED
    ) {
      throw new BadRequestException(
        `Cannot start migration. Current state: ${currentState}. Clear migration data first if needed.`,
      );
    }

    if (currentState === MigrationState.FAILED) {
      this.logger.log('Clearing previous failed migration data before retry');
      await this.clearEvents();
      await this.redis.safeDel(this.REDIS_ERROR_KEY);
    }

    try {
      await fs.access(planPath);
    } catch {
      throw new BadRequestException(`Plan file not found: ${planPath}`);
    }

    this.logger.log(`Starting migration plan: ${planPath}`);
    await this.setState(MigrationState.IN_MIGRATION);
    await this.setStartTime();

    try {
      const result = await this.pythonExecutor.executePython(
        'migration_plan.py',
        ['--plan', planPath],
        { timeout: 600000 }, // 10 minutes timeout
      );

      this.logger.debug('Migration result:', JSON.stringify(result));

      if (result?.result?.httpCode === 200) {
        await this.setState(MigrationState.MIGRATED);
        this.logger.log('Migration plan executed successfully');
      } else {
        this.logger.error(
          'Migration failed with result:',
          JSON.stringify(result, null, 2),
        );
        throw new Error(result?.result?.message || 'Migration failed');
      }
    } catch (error) {
      await this.setState(MigrationState.FAILED);
      await this.setError(error.message);
      this.logger.error('Migration plan failed:', error);
      throw error;
    } finally {
      await this.setEndTime();
      this.pollRedisEvents();
    }
  }

  async executeRestartPlan(): Promise<void> {
    const currentState = await this.getState();
    if (currentState !== MigrationState.MIGRATED) {
      throw new BadRequestException(
        `Cannot start restart. Current state: ${currentState}`,
      );
    }

    this.logger.log('Starting restart plan');
    await this.setState(MigrationState.RESTARTING);
    await this.setCurrentOperation('Executing restart plan');

    try {
      const result = await this.pythonExecutor.executePython(
        'restart_plan.py',
        [],
        { timeout: 600000 }, // 10 minutes timeout
      );

      if (result?.result?.httpCode === 200) {
        await this.setState(MigrationState.IDLE);
        await this.clearMigrationData();
        this.logger.log('Restart plan executed successfully');
      } else {
        throw new Error(result?.result?.message || 'Restart failed');
      }
    } catch (error) {
      await this.setState(MigrationState.FAILED);
      await this.setError(error.message);
      this.logger.error('Restart plan failed:', error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<MigrationStatus> {
    const [state, events, currentOperation, startTime, endTime, error] =
      await Promise.all([
        this.getState(),
        this.getEvents(),
        this.getCurrentOperation(),
        this.getStartTime(),
        this.getEndTime(),
        this.getError(),
      ]);

    return {
      state,
      events,
      currentOperation,
      startTime,
      endTime,
      error,
    };
  }

  async cancelMigration(): Promise<void> {
    const currentState = await this.getState();
    if (
      currentState === MigrationState.IDLE ||
      currentState === MigrationState.FAILED
    ) {
      throw new BadRequestException('No active migration to cancel');
    }

    await this.setState(MigrationState.FAILED);
    await this.setError('Migration cancelled by user');
    await this.setEndTime();
    this.logger.log('Migration cancelled');
  }

  async clearMigrationData(): Promise<void> {
    const keys = [
      this.REDIS_STATE_KEY,
      this.REDIS_EVENTS_KEY,
      this.REDIS_CURRENT_OP_KEY,
      this.REDIS_START_TIME_KEY,
      this.REDIS_END_TIME_KEY,
      this.REDIS_ERROR_KEY,
    ];

    await Promise.all(keys.map((key) => this.redis.safeDel(key)));
    this.logger.log('Migration data cleared');
  }

  private mapVmwareEventToMigrationEvent(vmwareEvent: any): MigrationEvent {
    // Map des événements VMware vers les types attendus
    const eventTypeMap: Record<string, MigrationEvent['type']> = {
      'VMStartedEvent': 'vm_started',
      'VMMigrationEvent': 'vm_migration',
      'VMShutdownEvent': 'vm_shutdown',
      'ServerShutdownEvent': 'server_shutdown',
    };

    // Déterminer le type d'événement
    const eventType = eventTypeMap[vmwareEvent.type] || vmwareEvent.type;

    // Construire l'événement au format attendu
    const migrationEvent: MigrationEvent = {
      type: eventType,
      timestamp: vmwareEvent.timestamp || new Date().toISOString(),
      success: vmwareEvent.success ?? true,
    };

    // Ajouter les champs spécifiques selon le type d'événement
    switch (eventType) {
      case 'vm_started':
      case 'vm_shutdown':
        migrationEvent.vmName = vmwareEvent.vm || vmwareEvent.vmName;
        migrationEvent.vmMoid = vmwareEvent.vmMoid || vmwareEvent.moid;
        break;
      
      case 'vm_migration':
        migrationEvent.vmName = vmwareEvent.vm || vmwareEvent.vmName;
        migrationEvent.vmMoid = vmwareEvent.vmMoid || vmwareEvent.moid;
        migrationEvent.sourceMoid = vmwareEvent.source || vmwareEvent.sourceMoid;
        migrationEvent.destinationMoid = vmwareEvent.destination || vmwareEvent.destinationMoid;
        break;
      
      case 'server_shutdown':
        migrationEvent.serverName = vmwareEvent.server || vmwareEvent.serverName;
        migrationEvent.serverMoid = vmwareEvent.serverMoid || vmwareEvent.moid;
        break;
    }

    // Ajouter le message d'erreur si présent
    if (vmwareEvent.error) {
      migrationEvent.error = vmwareEvent.error;
      migrationEvent.success = false;
    }

    // Ajouter le message descriptif si présent
    if (vmwareEvent.message) {
      migrationEvent.message = vmwareEvent.message;
    }

    return migrationEvent;
  }

  private async pollRedisEvents(): Promise<void> {
    try {
      const rawEvents = await this.redis.safeLRange(
        this.REDIS_EVENTS_KEY,
        0,
        -1,
      );
      
      const events = rawEvents.map((e) => {
        const parsedEvent = JSON.parse(e);
        // Si c'est un événement VMware natif, le transformer
        if (parsedEvent.type && parsedEvent.type.endsWith('Event')) {
          return this.mapVmwareEventToMigrationEvent(parsedEvent);
        }
        // Sinon, le retourner tel quel (déjà au bon format)
        return parsedEvent;
      });

      for (const event of events) {
        this.eventEmitter.emit('migration.event', event);
      }
    } catch (error) {
      this.logger.error('Failed to poll Redis events:', error);
    }
  }

  private async getState(): Promise<MigrationState> {
    const state = await this.redis.safeGet(this.REDIS_STATE_KEY);
    return (state as MigrationState) || MigrationState.IDLE;
  }

  private async setState(state: MigrationState): Promise<void> {
    await this.redis.safeSet(this.REDIS_STATE_KEY, state);
    this.eventEmitter.emit('migration.stateChange', { state });
  }

  private async getEvents(): Promise<MigrationEvent[]> {
    try {
      const rawEvents = await this.redis.safeLRange(
        this.REDIS_EVENTS_KEY,
        0,
        -1,
      );
      return rawEvents.map((e) => {
        const parsedEvent = JSON.parse(e);
        // Si c'est un événement VMware natif, le transformer
        if (parsedEvent.type && parsedEvent.type.endsWith('Event')) {
          return this.mapVmwareEventToMigrationEvent(parsedEvent);
        }
        // Sinon, le retourner tel quel (déjà au bon format)
        return parsedEvent;
      });
    } catch (error) {
      this.logger.error('Failed to get events:', error);
      return [];
    }
  }

  private async getCurrentOperation(): Promise<string | undefined> {
    return await this.redis.safeGet(this.REDIS_CURRENT_OP_KEY);
  }

  private async clearEvents(): Promise<void> {
    await this.redis.safeDel(this.REDIS_EVENTS_KEY);
  }

  private async setCurrentOperation(operation: string): Promise<void> {
    await this.redis.safeSet(this.REDIS_CURRENT_OP_KEY, operation);
    this.eventEmitter.emit('migration.operationChange', { operation });
  }

  private async getStartTime(): Promise<string | undefined> {
    return await this.redis.safeGet(this.REDIS_START_TIME_KEY);
  }

  private async setStartTime(): Promise<void> {
    await this.redis.safeSet(
      this.REDIS_START_TIME_KEY,
      new Date().toISOString(),
    );
  }

  private async getEndTime(): Promise<string | undefined> {
    return await this.redis.safeGet(this.REDIS_END_TIME_KEY);
  }

  private async setEndTime(): Promise<void> {
    await this.redis.safeSet(this.REDIS_END_TIME_KEY, new Date().toISOString());
  }

  private async getError(): Promise<string | undefined> {
    return await this.redis.safeGet(this.REDIS_ERROR_KEY);
  }

  private async setError(error: string): Promise<void> {
    await this.redis.safeSet(this.REDIS_ERROR_KEY, error);
  }
}
