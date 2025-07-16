export interface VmInfo {
  moid: string;
  name?: string;
  sourceServer: string;
  destinationServer?: string;
}

export interface MigrationPlanAnalysis {
  migrationType: 'migration' | 'shutdown' | 'restart';
  sourceServers: string[];
  destinationServers: string[];
  affectedVms: VmInfo[];
  totalVmsCount: number;
  hasDestination: boolean;
  upsGracePeriod?: number;
}

export interface MigrationLogContext {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}
