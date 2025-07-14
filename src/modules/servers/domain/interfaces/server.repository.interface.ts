import { FindAllByFieldOptions } from '@/core/utils/index';
import { Server } from '../entities/server.entity';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface ServerRepositoryInterface
  extends GenericRepositoryInterface<Server> {
  findAllByField<T extends PrimitiveFields<Server>>(
    options: FindAllByFieldOptions<Server, T>,
  ): Promise<Server[]>;

  findAllByFieldPaginated<T extends PrimitiveFields<Server>>(
    options: FindAllByFieldOptions<Server, T>,
    page: number,
    limit: number,
  ): Promise<[Server[], number]>;

  findServerById(
    id: string,
    select?: (keyof Server)[] | string[],
  ): Promise<Server | null>;
  findServerByIdWithCredentials(id: string): Promise<Server | null>;
  findAllWithCredentials(): Promise<Server[]>;
  deleteServer(id: string): Promise<void>;
  updateServer(id: string, data: Partial<Server>): Promise<Server>;
  countByState(state: 'UP' | 'DOWN'): Promise<number>;
  findByIloIp(iloIp: string): Promise<Server | null>;
}
