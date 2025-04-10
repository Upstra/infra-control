import { Server } from '../entities/server.entity';

export interface ServerRepositoryInterface {
  findAll(): Promise<Server[]>;
  findServerById(id: string): Promise<Server | null>;
  save(server: Server): Promise<Server>;
  deleteServer(id: string): Promise<void>;
}
