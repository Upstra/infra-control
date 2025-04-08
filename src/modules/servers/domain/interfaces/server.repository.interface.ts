import { Server } from '../entities/server.entity';

export interface ServerRepositoryInterface {
  findAll(): Promise<Server[]>;
  findServerById(id: string): Promise<Server | null>;
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
    groupId: string,
    roomId: string,
    upsId: string,
  ): Promise<Server>;
  updateServer(
    id: string,
    name: string,
    state: string,
    grace_period_on: number,
    grace_period_off: number,
    ip: string,
    login: string,
    password: string,
    type: string,
    priority: number,
    groupId: string,
    roomId: string,
    upsId: string,
  ): Promise<Server>;
  deleteServer(id: string): Promise<void>;
}
