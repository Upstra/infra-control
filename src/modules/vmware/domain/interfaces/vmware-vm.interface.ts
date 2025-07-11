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
}

export interface VmwareVmMetrics {
  powerState: 'poweredOn' | 'poweredOff' | 'suspended';
  guestState: 'running' | 'notRunning' | 'shuttingDown' | 'unknown';
  connectionState: 'connected' | 'disconnected' | 'orphaned';
  guestHeartbeatStatus: 'green' | 'yellow' | 'red' | 'gray';
  overallStatus: 'green' | 'yellow' | 'red' | 'gray';
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

export interface VmwareHost {
  name: string;
  ip: string;
  powerState: 'poweredOn' | 'poweredOff' | 'standBy';
  vCenterIp: string;
  overallStatus: 'green' | 'yellow' | 'red' | 'gray';
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
