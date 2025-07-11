import { VmwareVm, VmwareVmMetrics, VmwareHost } from '../domain/interfaces';
import { VmwareConnectionDto } from '../application/dto';

export const mockVmwareConnection: VmwareConnectionDto = {
  host: '192.168.1.10',
  user: 'admin',
  password: 'password123',
  port: 443,
};

export const mockVmwareVm: VmwareVm = {
  moid: 'vm-123',
  name: 'Test VM',
  powerState: 'poweredOn',
  guestOS: 'Ubuntu Linux (64-bit)',
  ipAddress: '192.168.1.100',
  hostname: 'test-vm',
  numCpu: 4,
  memoryMB: 8192,
  toolsStatus: 'toolsOk',
  annotation: 'Test virtual machine',
};

export const mockVmwareVmMetrics: VmwareVmMetrics = {
  vmName: 'Test VM',
  powerState: 'poweredOn',
  cpuUsageMhz: 1500,
  memoryUsageMB: 4096,
  storageUsageGB: 50.5,
  uptimeSeconds: 86400,
  guestOS: 'Ubuntu Linux (64-bit)',
  toolsStatus: 'toolsOk',
  ipAddress: '192.168.1.100',
  numCpu: 4,
  memoryMB: 8192,
};

export const mockVmwareHost: VmwareHost = {
  moid: 'host-123',
  name: 'ESXi-Host-01',
  connectionState: 'connected',
  powerState: 'poweredOn',
  cpuInfo: {
    model: 'Intel Xeon E5-2680',
    cores: 16,
    threads: 32,
    mhz: 2400,
  },
  memoryInfo: {
    totalMB: 131072,
    usedMB: 65536,
    freeMB: 65536,
  },
  uptimeSeconds: 432000,
};

export const createMockVmList = (count: number = 3): VmwareVm[] => {
  return Array.from({ length: count }, (_, i) => ({
    moid: `vm-${i + 1}`,
    name: `Test VM ${i + 1}`,
    powerState: i % 2 === 0 ? 'poweredOn' : 'poweredOff',
    guestOS: i % 2 === 0 ? 'Ubuntu Linux (64-bit)' : 'Windows Server 2019',
    ipAddress: `192.168.1.${100 + i}`,
    hostname: `test-vm-${i + 1}`,
    numCpu: 2 + (i % 3) * 2,
    memoryMB: 4096 * (i + 1),
    toolsStatus: 'toolsOk',
  }));
};