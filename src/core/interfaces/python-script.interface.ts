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
  power_state: 'poweredOn' | 'poweredOff' | 'suspended';
  guest_os: string;
  cpu_count: number;
  memory_mb: number;
  host: string;
  datastore: string;
  ip_address?: string;
  tools_status?: string;
}

export interface MigrationResult {
  vm_name: string;
  source_host: string;
  destination_host: string;
  status: 'success' | 'failed';
  error?: string;
  duration_seconds?: number;
}

export interface PythonScriptError {
  error: string;
  code?: string;
  details?: any;
}