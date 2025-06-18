import { FindOneByFieldOptions } from '../utils/index';

export interface GenericRepositoryInterface<T> {
  count(): Promise<number>;
  save(entity: T): Promise<T>;
  findAll(relations?: string[]): Promise<T[]>;
  findOneByField<K extends keyof T>(
    options: FindOneByFieldOptions<T, K>,
  ): Promise<T | null>;
}
