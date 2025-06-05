import { FindOneByFieldOptions } from '@/core/utils/find-one-by-field-options';
import { FindAllByFieldOptions } from '@/core/utils/find-all-by-field-options';
import { Server } from '../entities/server.entity';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';

export interface ServerRepositoryInterface {
  findByIds(ids: string[], relations?: string[]): Promise<Server[]>;
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
