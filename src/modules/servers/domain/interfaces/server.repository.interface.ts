import { FindOneByFieldOptions } from '@/core/utils/find-one-by-field-options';
import { Server } from '../entities/server.entity';

export interface ServerRepositoryInterface {
  findByIds(serverIds: string[]): Server[] | PromiseLike<Server[]>;
  findOneByField<T extends keyof Server>(
    options: FindOneByFieldOptions<Server, T>,
  ): Promise<Server | null>;

  findAll(): Promise<Server[]>;
  findServerById(id: string): Promise<Server | null>;
  save(server: Server): Promise<Server>;
  deleteServer(id: string): Promise<void>;
}
