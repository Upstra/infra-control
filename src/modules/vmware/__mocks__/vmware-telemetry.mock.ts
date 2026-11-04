import {
  HostTelemetry,
  InventoryHost,
  InventoryVm,
  VcenterEvent,
  VmTelemetry,
} from '../domain/interfaces/vmware-telemetry.interface';

export const createInventoryVm = (
  overrides: Partial<InventoryVm> = {},
): InventoryVm => ({
  moid: 'vm-1042',
  name: 'db-pg-02',
  hostMoid: 'host-33',
  powerState: 'poweredOn',
  connectionState: 'connected',
  guestState: 'running',
  heartbeat: 'green',
  overallStatus: 'green',
  cpuUsageMhz: 1840,
  cpuMaxMhz: 18400,
  cpuPercent: 10,
  memoryUsageMb: 4096,
  memoryMb: 32768,
  numCpu: 8,
  uptimeSeconds: 3600,
  bootTime: '2026-11-04T19:00:00.000Z',
  ip: '10.20.3.12',
  ...overrides,
});

export const createInventoryHost = (
  overrides: Partial<InventoryHost> = {},
): InventoryHost => ({
  moid: 'host-33',
  name: 'esx-03',
  connectionState: 'connected',
  powerState: 'poweredOn',
  maintenance: false,
  overallStatus: 'green',
  cpuPercent: 40,
  memoryPercent: 60,
  uptimeSeconds: 3456000,
  ...overrides,
});

export const createVmTelemetry = (
  overrides: Partial<VmTelemetry> = {},
): VmTelemetry => ({
  ...createInventoryVm(),
  health: 'up',
  cpuHighStreak: 0,
  metricsAt: new Date().toISOString(),
  ...overrides,
});

export const createHostTelemetry = (
  overrides: Partial<HostTelemetry> = {},
): HostTelemetry => ({
  ...createInventoryHost(),
  health: 'up',
  cpuHighStreak: 0,
  metricsAt: new Date().toISOString(),
  ...overrides,
});

export const createVcenterEvent = (
  overrides: Partial<VcenterEvent> = {},
): VcenterEvent => ({
  key: 884213,
  type: 'VmPoweredOffEvent',
  createdAt: '2026-11-04T20:05:10.000Z',
  userName: 'VSPHERE.LOCAL\\jbidule',
  vmMoid: 'vm-1042',
  vmName: 'db-pg-02',
  hostMoid: 'host-33',
  hostName: 'esx-03',
  message: 'db-pg-02 on esx-03 in DC-1 is powered off',
  ...overrides,
});
