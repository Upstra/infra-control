export interface VmwareVm {
  moid: string;
  name: string;
  powerState: 'poweredOn' | 'poweredOff' | 'suspended';
  guestOS?: string;
  ipAddress?: string;
  hostname?: string;
  numCpu?: number;
  memoryMB?: number;
  toolsStatus?: string;
  annotation?: string;
}

export interface VmwareVmMetrics {
  vmName: string;
  powerState: string;
  cpuUsageMhz: number;
  memoryUsageMB: number;
  storageUsageGB: number;
  uptimeSeconds: number;
  guestOS: string;
  toolsStatus: string;
  ipAddress?: string;
  numCpu: number;
  memoryMB: number;
}

export interface VmwareHost {
  moid: string;
  name: string;
  connectionState: 'connected' | 'disconnected' | 'notResponding';
  powerState: 'poweredOn' | 'poweredOff' | 'standBy';
  cpuInfo: {
    model: string;
    cores: number;
    threads: number;
    mhz: number;
  };
  memoryInfo: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
  };
  uptimeSeconds: number;
}
