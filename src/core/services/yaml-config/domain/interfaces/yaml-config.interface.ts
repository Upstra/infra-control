export interface VCenterConfig {
  ip: string;
  user: string;
  password: string;
  port: number;
}

export interface IloConfig {
  ip: string;
  user: string;
  password: string;
}

export interface HostConfig {
  name: string;
  moid: string;
  ilo?: IloConfig;
}

export interface UpsConfig {
  shutdownGrace: number;
  restartGrace: number;
}

export interface ServerMigrationConfig {
  server: {
    host: HostConfig;
    destination?: HostConfig;
    vmOrder: Array<{ vmMoId: string }>;
  };
}

export interface MigrationPlanConfig {
  vCenter: VCenterConfig;
  ups: UpsConfig;
  servers: ServerMigrationConfig[];
}

export interface IYamlConfigService {
  generateMigrationPlanContent(config: MigrationPlanConfig): string;
  parseMigrationPlanContent(content: string): MigrationPlanConfig;
  writeMigrationPlan(filename: string, content: string): Promise<string>;
  readMigrationPlan(filename: string): Promise<MigrationPlanConfig>;
  deleteMigrationPlan(filename: string): Promise<void>;
  listMigrationPlans(): Promise<string[]>;
}
