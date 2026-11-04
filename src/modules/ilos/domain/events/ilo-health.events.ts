import {
  IloHealth,
  RoomInletThresholdsRef,
} from '../interfaces/ilo-health.interface';

export enum IloHealthEvents {
  CHECKED = 'ilo.health.checked',
  UNREACHABLE = 'ilo.health.unreachable',
}

export interface IloHealthCheckedEvent {
  serverId: string;
  serverName: string;
  roomId: string | null;
  room: RoomInletThresholdsRef | null;
  health: IloHealth;
}

export interface IloHealthUnreachableEvent {
  serverId: string;
  serverName: string;
  iloIp: string;
  failures: number;
  error: string;
}
