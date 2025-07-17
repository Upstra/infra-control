export interface VmUpdateResult {
  vmMoid: string;
  vmName: string;
  oldHost?: string;
  newHost?: string;
  host?: string;
  reason?: string;
  error?: string;
}

export interface VmUpdateResponse {
  status: 'successful' | 'failed' | 'unchanged';
  data: VmUpdateResult;
}

export interface VmUpdateBatchResults {
  successful: VmUpdateResult[];
  failed: VmUpdateResult[];
  unchanged: VmUpdateResult[];
}