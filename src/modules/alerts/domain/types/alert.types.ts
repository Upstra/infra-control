export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export enum AlertStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum AlertResourceType {
  UPS = 'ups',
  SERVER = 'server',
  VM = 'vm',
  ROOM = 'room',
}

export enum AlertTransitionType {
  OPENED = 'opened',
  ESCALATED = 'escalated',
  DEESCALATED = 'deescalated',
  ACKNOWLEDGED = 'acknowledged',
  UNACKNOWLEDGED = 'unacknowledged',
  RESOLVED = 'resolved',
}

export enum AlertType {
  UPS_ON_BATTERY = 'ups_on_battery',
  UPS_LOW_BATTERY = 'ups_low_battery',
  UPS_UNREACHABLE = 'ups_unreachable',
  UPS_OVERLOAD = 'ups_overload',
  UPS_REPLACE_BATTERY = 'ups_replace_battery',
  VM_POWERED_OFF = 'vm_powered_off',
  VM_HEARTBEAT_LOST = 'vm_heartbeat_lost',
  HOST_DISCONNECTED = 'host_disconnected',
  HOST_CPU_HIGH = 'host_cpu_high',
}

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  [AlertSeverity.CRITICAL]: 3,
  [AlertSeverity.WARNING]: 2,
  [AlertSeverity.INFO]: 1,
};
