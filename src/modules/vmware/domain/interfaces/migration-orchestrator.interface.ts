export enum MigrationState {
  IDLE = 'idle',
  IN_MIGRATION = 'in migration',
  MIGRATED = 'migrated',
  RESTARTING = 'restarting',
  FAILED = 'failed',
}

export interface MigrationEvent {
  type: 'vm_migration' | 'vm_shutdown' | 'server_shutdown';
  timestamp: string;
  vmName?: string;
  vmMoid?: string;
  sourceMoid?: string;
  destinationMoid?: string;
  serverMoid?: string;
  serverName?: string;
  success: boolean;
  error?: string;
}

export interface MigrationStatus {
  state: MigrationState;
  events: MigrationEvent[];
  currentOperation?: string;
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface IMigrationOrchestrator {
  executeMigrationPlan(planPath: string): Promise<void>;
  executeRestartPlan(): Promise<void>;
  getMigrationStatus(): Promise<MigrationStatus>;
  cancelMigration(): Promise<void>;
  clearMigrationData(): Promise<void>;
}
