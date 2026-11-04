import {
  HostTelemetry,
  PowerOffCause,
  VmTelemetry,
} from '../interfaces/vmware-telemetry.interface';

export enum VmwareTelemetryEvents {
  METRICS_COLLECTED = 'vmware.metrics.collected',
  VM_POWERED_OFF = 'vmware.vm.powered-off',
  VM_POWERED_ON = 'vmware.vm.powered-on',
}

export interface VmwareMetricsCollectedEvent {
  collectedAt: string;
  vms: VmTelemetry[];
  hosts: HostTelemetry[];
  changedVms: VmTelemetry[];
  changedHosts: HostTelemetry[];
  upstraPlanActive: boolean;
}

export interface VmPoweredOffEvent {
  moid: string;
  name: string | null;
  hostMoid: string | null;
  powerOff: PowerOffCause;
}

export interface VmPoweredOnEvent {
  moid: string;
  name: string | null;
  at: string;
}
