import { FindOneByFieldOptions } from '../utils/find-one-by-field-options';

export interface GenericRepositoryInterface<T> {
  findAll(relations?: string[]): Promise<T[]>;
  findOneByField<K extends keyof T>(
    options: FindOneByFieldOptions<T, K>,
  ): Promise<T | null>;
}
