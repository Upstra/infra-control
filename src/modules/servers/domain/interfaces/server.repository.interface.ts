import { FindOneByFieldOptions } from '@/core/utils/index';
import { FindAllByFieldOptions } from '@/core/utils/index';
import { Server } from '../entities/server.entity';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';

export interface ServerRepositoryInterface {
  findAllByField<T extends PrimitiveFields<Server>>(
    options: FindAllByFieldOptions<Server, T>,
  ): Promise<Server[]>;
  findOneByField<T extends keyof Server>(
    options: FindOneByFieldOptions<Server, T>,
  ): Promise<Server | null>;

  findAll(): Promise<Server[]>;
  findServerById(id: string): Promise<Server | null>;
  save(server: Server): Promise<Server>;
  deleteServer(id: string): Promise<void>;
}
