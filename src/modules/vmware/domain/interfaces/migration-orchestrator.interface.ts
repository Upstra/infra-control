export enum MigrationState {
  IDLE = 'idle',
  GRACE_SHUTDOWN = 'grace_shutdown',
  SHUTTING_DOWN = 'shutting_down',
  IN_MIGRATION = 'in_migration',
  MIGRATED = 'migrated',
  RESTARTING = 'restarting',
  FAILED = 'failed',
}

export interface MigrationEvent {
  type: 'vm_migration' | 'vm_shutdown' | 'vm_started' | 'server_shutdown' | 'grace_period' | 'start_shutdown' | 'finish_shutdown';
  timestamp: string;
  vmName?: string;
  vmMoid?: string;
  sourceMoid?: string;
  destinationMoid?: string;
  serverMoid?: string;
  serverName?: string;
  success: boolean;
  error?: string;
  message?: string;
}

export interface MigrationStatus {
  state: MigrationState;
  events: MigrationEvent[];
  currentOperation?: string;
  startTime?: string;
  endTime?: string;
  error?: string;
}

import { RequestContextDto } from '@/core/dto/request-context.dto';

export interface IMigrationOrchestrator {
  executeMigrationPlan(
    planPath: string,
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<void>;
  executeRestartPlan(
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<void>;
  getMigrationStatus(): Promise<MigrationStatus>;
  cancelMigration(): Promise<void>;
  clearMigrationData(): Promise<void>;
}
