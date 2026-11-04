export type VmHealth = 'up' | 'degraded' | 'down' | 'unknown';
export type PowerOffCauseType = 'ha' | 'upstra' | 'manual';

export interface InventoryVm {
  moid: string;
  name: string | null;
  hostMoid: string | null;
  powerState: string | null;
  connectionState: string | null;
  guestState: string | null;
  heartbeat: string | null;
  overallStatus: string | null;
  cpuUsageMhz: number | null;
  cpuMaxMhz: number | null;
  cpuPercent: number | null;
  memoryUsageMb: number | null;
  memoryMb: number | null;
  numCpu: number | null;
  uptimeSeconds: number | null;
  bootTime: string | null;
  ip: string | null;
}

export interface InventoryHost {
  moid: string;
  name: string | null;
  connectionState: string | null;
  powerState: string | null;
  maintenance: boolean | null;
  overallStatus: string | null;
  cpuPercent: number | null;
  memoryPercent: number | null;
  uptimeSeconds: number | null;
}

export interface InventorySnapshot {
  collectedAt: string;
  vms: InventoryVm[];
  hosts: InventoryHost[];
}

export interface VmTelemetry extends InventoryVm {
  health: VmHealth;
  cpuHighStreak: number;
  metricsAt: string;
}

export interface HostTelemetry extends InventoryHost {
  health: VmHealth;
  cpuHighStreak: number;
  metricsAt: string;
}

export interface VcenterEvent {
  key: number;
  type: string;
  createdAt: string;
  userName: string | null;
  vmMoid: string | null;
  vmName: string | null;
  hostMoid: string | null;
  hostName: string | null;
  message: string | null;
}

export interface VcenterEventsResult {
  until: string;
  events: VcenterEvent[];
}

export interface PowerOffCause {
  at: string;
  cause: PowerOffCauseType;
  by: string | null;
}

export interface VcenterEventsCursor {
  createdAt: string;
  keys: number[];
}
