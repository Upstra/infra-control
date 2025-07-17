import { MigrationEvent } from './migration-orchestrator.interface';
import { VmInfo } from './migration-plan-analysis.interface';

export interface MigrationCompletedEvent {
  sessionId: string;
  userId?: string;
  migrationType: 'migration' | 'shutdown' | 'restart';
  events: MigrationEvent[];
  affectedVms: VmInfo[];
  successfulVms: string[];
  failedVms: string[];
}
