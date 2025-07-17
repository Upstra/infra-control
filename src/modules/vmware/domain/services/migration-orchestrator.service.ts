import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import {
  IMigrationOrchestrator,
  MigrationState,
  MigrationStatus,
  MigrationEvent,
} from '../interfaces/migration-orchestrator.interface';
import { MigrationPlanAnalysis } from '../interfaces/migration-plan-analysis.interface';
import type { VmInfo } from '../interfaces/migration-plan-analysis.interface';
import { MigrationCompletedEvent } from '../interfaces/migration-completed-event.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { RequestContextDto } from '@/core/dto/request-context.dto';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';

@Injectable()
export class MigrationOrchestratorService implements IMigrationOrchestrator {
  private readonly logger = new Logger(MigrationOrchestratorService.name);
  private readonly REDIS_STATE_KEY = 'migration:state';
  private readonly REDIS_EVENTS_KEY = 'migration:events';
  private readonly REDIS_CURRENT_OP_KEY = 'migration:current_operation';
  private readonly REDIS_START_TIME_KEY = 'migration:start_time';
  private readonly REDIS_END_TIME_KEY = 'migration:end_time';
  private readonly REDIS_ERROR_KEY = 'migration:error';
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly redis: RedisSafeService,
    private readonly pythonExecutor: PythonExecutorService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly logHistoryUseCase?: LogHistoryUseCase,
    @Optional()
    @Inject('VmRepositoryInterface')
    private readonly vmRepository?: VmRepositoryInterface,
  ) {}

  async executeMigrationPlan(
    planPath: string,
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<void> {
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

    const sessionId =
      requestContext?.correlationId || `migration-${Date.now()}`;
    const startTime = new Date();
    let planAnalysis: MigrationPlanAnalysis | undefined;

    try {
      planAnalysis = await this.analyzeMigrationPlan(planPath);

      if (this.logHistoryUseCase && userId) {
        await this.logHistoryUseCase.executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'START_MIGRATION',
          userId,
          metadata: {
            migrationType: planAnalysis.migrationType,
            planPath,
            sourceServers: planAnalysis.sourceServers,
            destinationServers: planAnalysis.destinationServers,
            affectedVms: planAnalysis.affectedVms,
            totalVmsCount: planAnalysis.totalVmsCount,
            hasDestination: planAnalysis.hasDestination,
            upsGracePeriod: planAnalysis.upsGracePeriod,
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }
    } catch (analysisError) {
      this.logger.warn('Failed to analyze migration plan:', analysisError);
    }

    await this.setState(MigrationState.IN_MIGRATION);
    await this.setStartTime();

    try {
      const result = await this.pythonExecutor.executePython(
        'migration_plan.py',
        ['--plan', planPath],
        { timeout: 600000 }, // 10 minutes timeout
      );

      this.logger.debug('Migration result:', JSON.stringify(result));
      this.logger.debug('Migration script output:', result);
      this.startEventPolling();

      await this.setState(MigrationState.MIGRATED);
      this.logger.log('Migration plan executed successfully');

      if (this.logHistoryUseCase && userId) {
        const endTime = new Date();
        const events = await this.getEvents();

        const successfulVmEvents = events.filter(
          (e) => e.type === 'vm_migration' && e.success && e.vmMoid,
        );

        const successfulVmMoids = successfulVmEvents.map((e) => e.vmMoid!);
        const failedVmMoids = events
          .filter((e) => e.type === 'vm_migration' && !e.success && e.vmMoid)
          .map((e) => e.vmMoid!);

        const successfulVms = events.filter(
          (e) =>
            (e.type === 'vm_migration' || e.type === 'vm_shutdown') &&
            e.success,
        ).length;
        const failedVms = events.filter(
          (e) =>
            (e.type === 'vm_migration' || e.type === 'vm_shutdown') &&
            !e.success,
        ).length;

        await this.logHistoryUseCase.executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'COMPLETE_MIGRATION',
          userId,
          metadata: {
            migrationType: planAnalysis?.migrationType || 'unknown',
            duration: endTime.getTime() - startTime.getTime(),
            result: 'success',
            successfulVms,
            failedVms,
            events: events.slice(0, 50),
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });

        this.eventEmitter.emit('migration.completed', {
          sessionId,
          userId,
          migrationType: planAnalysis?.migrationType || 'migration',
          events,
          affectedVms: planAnalysis?.affectedVms || [],
          successfulVms: successfulVmMoids,
          failedVms: failedVmMoids,
        } as MigrationCompletedEvent);
      }
    } catch (error) {
      await this.setState(MigrationState.FAILED);
      await this.setError(error.message);
      this.logger.error('Migration plan failed:', error);

      if (this.logHistoryUseCase && userId) {
        const endTime = new Date();
        await this.logHistoryUseCase.executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'FAILED_MIGRATION',
          userId,
          metadata: {
            migrationType: planAnalysis?.migrationType || 'unknown',
            duration: endTime.getTime() - startTime.getTime(),
            result: 'failed',
            errorMessage: error.message,
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }

      throw error;
    } finally {
      await this.setEndTime();
      this.stopEventPolling();
      await this.pollRedisEvents();
    }
  }

  async executeRestartPlan(
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<void> {
    const currentState = await this.getState();
    if (currentState !== MigrationState.MIGRATED) {
      throw new BadRequestException(
        `Cannot start restart. Current state: ${currentState}`,
      );
    }

    this.logger.log('Starting restart plan');
    const sessionId = requestContext?.correlationId || `restart-${Date.now()}`;
    const startTime = new Date();

    if (this.logHistoryUseCase && userId) {
      await this.logHistoryUseCase.executeStructured({
        entity: 'migration',
        entityId: sessionId,
        action: 'START_RESTART',
        userId,
        metadata: {
          migrationType: 'restart',
        },
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      });
    }

    await this.setState(MigrationState.RESTARTING);
    await this.setCurrentOperation('Executing restart plan');

    try {
      const result = await this.pythonExecutor.executePython(
        'restart_plan.py',
        [],
        { timeout: 600000 }, // 10 minutes timeout
      );

      this.logger.debug('Restart script output:', result);
      this.startEventPolling();
      await this.setState(MigrationState.IDLE);
      await this.clearMigrationData();
      this.logger.log('Restart plan executed successfully');

      if (this.logHistoryUseCase && userId) {
        const endTime = new Date();
        await this.logHistoryUseCase.executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'COMPLETE_RESTART',
          userId,
          metadata: {
            migrationType: 'restart',
            duration: endTime.getTime() - startTime.getTime(),
            result: 'success',
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }
    } catch (error) {
      await this.setState(MigrationState.FAILED);
      await this.setError(error.message);
      this.logger.error('Restart plan failed:', error);

      if (this.logHistoryUseCase && userId) {
        const endTime = new Date();
        await this.logHistoryUseCase.executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'FAILED_RESTART',
          userId,
          metadata: {
            migrationType: 'restart',
            duration: endTime.getTime() - startTime.getTime(),
            result: 'failed',
            errorMessage: error.message,
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }

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
    const eventTypeMap: Record<string, MigrationEvent['type']> = {
      VMStartedEvent: 'vm_started',
      VMMigrationEvent: 'vm_migration',
      VMShutdownEvent: 'vm_shutdown',
      ServerShutdownEvent: 'server_shutdown',
    };

    const eventType = eventTypeMap[vmwareEvent.type] || vmwareEvent.type;
    const migrationEvent: MigrationEvent = {
      type: eventType,
      timestamp: vmwareEvent.timestamp || new Date().toISOString(),
      success: vmwareEvent.success ?? true,
    };

    switch (eventType) {
      case 'vm_started':
      case 'vm_shutdown':
        migrationEvent.vmName = vmwareEvent.vm || vmwareEvent.vmName;
        migrationEvent.vmMoid = vmwareEvent.vmMoid || vmwareEvent.moid;
        break;

      case 'vm_migration':
        migrationEvent.vmName = vmwareEvent.vm || vmwareEvent.vmName;
        migrationEvent.vmMoid = vmwareEvent.vmMoid || vmwareEvent.moid;
        migrationEvent.sourceMoid =
          vmwareEvent.source || vmwareEvent.sourceMoid;
        migrationEvent.destinationMoid =
          vmwareEvent.destination || vmwareEvent.destinationMoid;
        break;

      case 'server_shutdown':
        migrationEvent.serverName =
          vmwareEvent.server || vmwareEvent.serverName;
        migrationEvent.serverMoid = vmwareEvent.serverMoid || vmwareEvent.moid;
        break;
    }

    if (vmwareEvent.error) {
      migrationEvent.error = vmwareEvent.error;
      migrationEvent.success = false;
    }

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

      if (rawEvents.length > 0) {
        this.logger.debug(`Found ${rawEvents.length} events in Redis`);
      }

      const events = rawEvents.map((e) => {
        const parsedEvent = JSON.parse(e);
        this.logger.debug('Raw event from Redis:', parsedEvent);
        if (parsedEvent.type && parsedEvent.type.endsWith('Event')) {
          const transformedEvent =
            this.mapVmwareEventToMigrationEvent(parsedEvent);
          this.logger.debug('Transformed event:', transformedEvent);
          return transformedEvent;
        }
        return parsedEvent;
      });

      for (const event of events) {
        this.logger.log(`Emitting migration event: ${event.type}`);
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
        if (parsedEvent.type && parsedEvent.type.endsWith('Event')) {
          return this.mapVmwareEventToMigrationEvent(parsedEvent);
        }
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

  private startEventPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollRedisEvents();

    this.pollingInterval = setInterval(() => {
      this.pollRedisEvents();
    }, 2000);

    setTimeout(() => {
      this.stopEventPolling();
    }, 600000);
  }

  private stopEventPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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

  private async analyzeMigrationPlan(
    planPath: string,
  ): Promise<MigrationPlanAnalysis> {
    const planContent = await fs.readFile(planPath, 'utf-8');
    const plan: any = yaml.load(planContent);

    const hasDestination = plan.servers?.some((s: any) => s.destination);
    const affectedVms: VmInfo[] = [];
    const sourceServers: string[] = [];
    const destinationServers: string[] = [];

    if (plan.servers) {
      for (const server of plan.servers) {
        if (server.host?.name) {
          sourceServers.push(server.host.name);
        }
        if (server.destination?.name) {
          destinationServers.push(server.destination.name);
        }
        if (server.vm_order) {
          for (const vmMoid of server.vm_order) {
            affectedVms.push({
              moid: vmMoid,
              sourceServer: server.host?.name,
              destinationServer: server.destination?.name,
            });
          }
        }
      }
    }

    if (this.vmRepository) {
      for (const vm of affectedVms) {
        try {
          const vmEntity = await this.vmRepository.findOne({
            where: { moid: vm.moid },
          });
          if (vmEntity) {
            vm.name = vmEntity.name;
          }
        } catch (error) {
          this.logger.warn(`Failed to get VM name for ${vm.moid}:`, error);
        }
      }
    }

    return {
      migrationType: hasDestination ? 'migration' : 'shutdown',
      sourceServers: [...new Set(sourceServers)],
      destinationServers: [...new Set(destinationServers)],
      affectedVms,
      totalVmsCount: affectedVms.length,
      hasDestination,
      upsGracePeriod: plan.ups?.shutdown_grace,
    };
  }
}
