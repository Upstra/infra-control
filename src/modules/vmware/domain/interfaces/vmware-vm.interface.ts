export type VmwarePowerState = 'poweredOn' | 'poweredOff' | 'suspended';
export type VmwareServerPowerState = 'poweredOn' | 'poweredOff' | 'standBy';
export type VmwareGuestState =
  | 'running'
  | 'notRunning'
  | 'shuttingDown'
  | 'unknown';
export type VmwareConnectionState = 'connected' | 'disconnected' | 'orphaned';
export type VmwareHealthStatus = 'green' | 'yellow' | 'red' | 'gray';

export interface VmwareVm {
  moid: string;
  name: string;
  ip: string;
  guestOs: string;
  guestFamily: string;
  version: string;
  createDate: string;
  numCoresPerSocket: number;
  numCPU: number;
  esxiHostName: string;
  esxiHostMoid: string;
  powerState?: string;
  memoryMB?: number;
  hostname?: string;
  toolsStatus?: string;
  annotation?: string;
}

export interface VmwareVmMetrics {
  powerState: VmwarePowerState;
  guestState: VmwareGuestState;
  connectionState: VmwareConnectionState;
  guestHeartbeatStatus: VmwareHealthStatus;
  overallStatus: VmwareHealthStatus;
  maxCpuUsage: number;
  maxMemoryUsage: number;
  bootTime: string;
  isMigrating: boolean;
  overallCpuUsage: number;
  guestMemoryUsage: number;
  uptimeSeconds: number;
  swappedMemory: number;
  usedStorage: number;
  totalStorage: number;
}

export interface VmwareServerInfo {
  name: string;
  vCenterIp: string;
  cluster: string;
  vendor: string;
  model: string;
  ip: string;
  cpuCores: number;
  cpuThreads: number;
  cpuMHz: number;
  ramTotal: number;
}

export interface VmwareServerMetrics {
  powerState: VmwareServerPowerState;
  overallStatus: VmwareHealthStatus;
  rebootRequired: boolean;
  cpuUsagePercent: number;
  ramUsageMB: number;
  uptime: number;
  boottime: string;
}

export interface VmwareHost {
  name: string;
  ip: string;
  powerState: VmwareServerPowerState;
  vCenterIp: string;
  overallStatus: VmwareHealthStatus;
  cpuCores: number;
  ramTotal: number;
  rebootRequired: boolean;
  cpuUsageMHz: number;
  ramUsageMB: number;
  uptime: number;
  boottime: string;
  cluster: string;
  cpuHz: number;
  numCpuCores: number;
  numCpuThreads: number;
  model: string;
  vendor: string;
  biosVendor: string;
  firewall: string;
  maxHostRunningVms: number;
  maxHostSupportedVcpus: number;
  maxMemMBPerFtVm: number;
  maxNumDisksSVMotion: number;
  maxRegisteredVMs: number;
  maxRunningVMs: number;
  maxSupportedVcpus: number;
  maxSupportedVmMemory: number;
  maxVcpusPerFtVm: number;
  quickBootSupported: boolean;
  rebootSupported: boolean;
  shutdownSupported: boolean;
}
