export interface IloCredentials {
  host: string;
  user: string;
  password: string;
}

export interface IloServerStatus {
  name: string;
  power_state: 'On' | 'Off' | 'Unknown';
  health: 'OK' | 'Warning' | 'Critical' | 'Unknown';
  temperature?: number;
  model?: string;
  serial_number?: string;
}

export interface VmwareCredentials {
  host: string;
  user: string;
  password: string;
  port?: number;
}

export interface VmInfo {
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

export interface MigrationResult {
  vm_name: string;
  source_host: string;
  destination_host: string;
  status: 'success' | 'failed';
  error?: string;
  duration_seconds?: number;
}

export interface PythonScriptResult {
  result: {
    message: string;
    httpCode: number;
  };
}
