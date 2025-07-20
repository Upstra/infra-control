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
  ip: '192.168.1.100',
  guestOs: 'Ubuntu Linux (64-bit)',
  guestFamily: 'linuxGuest',
  version: 'vmx-15',
  createDate: '2023-01-01T00:00:00.000Z',
  numCoresPerSocket: 2,
  numCPU: 4,
  esxiHostName: 'ESXi-Host-01',
  esxiHostMoid: 'host-123',
};

export const mockVmwareVmMetrics: VmwareVmMetrics = {
  powerState: 'poweredOn',
  guestState: 'running',
  connectionState: 'connected',
  guestHeartbeatStatus: 'green',
  overallStatus: 'green',
  maxCpuUsage: 2400,
  maxMemoryUsage: 8192,
  bootTime: '2023-01-01T00:00:00.000Z',
  isMigrating: false,
  overallCpuUsage: 1500,
  guestMemoryUsage: 4096,
  uptimeSeconds: 86400,
  swappedMemory: 0,
  usedStorage: 53687091200,
  totalStorage: 107374182400,
};

export const mockVmwareHost: VmwareHost = {
  name: 'ESXi-Host-01',
  ip: '192.168.1.10',
  powerState: 'poweredOn',
  vCenterIp: '192.168.1.5',
  overallStatus: 'green',
  cpuCores: 16,
  ramTotal: 131072,
  rebootRequired: false,
  cpuUsageMHz: 2400,
  ramUsageMB: 65536,
  uptime: 432000,
  boottime: '2023-01-01T00:00:00.000Z',
  cluster: 'Test-Cluster',
  cpuHz: 2400000000,
  numCpuCores: 16,
  numCpuThreads: 32,
  model: 'Intel Xeon E5-2680',
  vendor: 'Intel',
  biosVendor: 'Dell Inc.',
  firewall: 'ruleset_data',
  maxHostRunningVms: 1024,
  maxHostSupportedVcpus: 768,
  maxMemMBPerFtVm: 32768,
  maxNumDisksSVMotion: 248,
  maxRegisteredVMs: 1024,
  maxRunningVMs: 1024,
  maxSupportedVcpus: 768,
  maxSupportedVmMemory: 4398046511104,
  maxVcpusPerFtVm: 4,
  quickBootSupported: true,
  rebootSupported: true,
  shutdownSupported: true,
};

export const createMockVmList = (count: number = 3): VmwareVm[] => {
  return Array.from({ length: count }, (_, i) => ({
    moid: `vm-${i + 1}`,
    name: `Test VM ${i + 1}`,
    ip: `192.168.1.${100 + i}`,
    guestOs: i % 2 === 0 ? 'Ubuntu Linux (64-bit)' : 'Windows Server 2019',
    guestFamily: i % 2 === 0 ? 'linuxGuest' : 'windowsGuest',
    version: 'vmx-15',
    createDate: '2023-01-01T00:00:00.000Z',
    numCoresPerSocket: 2,
    numCPU: 2 + (i % 3) * 2,
    esxiHostName: `ESXi-Host-${(i % 2) + 1}`,
    esxiHostMoid: `host-${(i % 2) + 1}`,
  }));
};
