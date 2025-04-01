import { Server } from '../entities/server.entity';

export interface ServerRepositoryInterface {
  findAll(): Promise<Server[]>;
  findServerById(id: number): Promise<Server | null>;
  createServer(
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: number,
    roomId: number,
    upsId: number,
  ): Promise<Server>;
  updateServer(
    id: number,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: number,
    roomId: number,
    upsId: number,
  ): Promise<Server>;
  deleteServer(id: number): Promise<void>;
}
