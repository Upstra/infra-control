export enum HistoryEntity {
  USER = 'user',
  AUTH = 'auth',
  ROLE = 'role',
  USER_ROLE = 'user_role',
  SERVER = 'server',
  VM = 'vm',
  UPS = 'ups',
  ROOM = 'room',
  GROUP = 'group',
  ILO = 'ilo',
  PERMISSION_SERVER = 'permission_server',
  PERMISSION_VM = 'permission_vm',
  SYSTEM_SETTINGS = 'system_settings',
  ALERT = 'alert',
}

export enum HistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  START = 'START',
  RESTART = 'RESTART',
  SHUTDOWN = 'SHUTDOWN',
  POWER_CONTROL = 'POWER_CONTROL',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  UNACKNOWLEDGE = 'UNACKNOWLEDGE',
}

export const FEED_HISTORY_ENTITIES: string[] = [
  HistoryEntity.SERVER,
  HistoryEntity.VM,
  HistoryEntity.UPS,
];

export const FEED_HISTORY_ACTIONS: string[] = [
  HistoryAction.START,
  HistoryAction.RESTART,
  HistoryAction.SHUTDOWN,
  HistoryAction.POWER_CONTROL,
  HistoryAction.UPDATE,
];
