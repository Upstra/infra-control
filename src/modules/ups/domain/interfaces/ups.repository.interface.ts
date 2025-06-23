import { Ups } from '../entities/ups.entity';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface UpsRepositoryInterface
  extends GenericRepositoryInterface<Ups> {
  findUpsById(id: string): Promise<Ups | null>;
  updateUps(ups: Ups): Promise<Ups>;
  deleteUps(id: string): Promise<void>;
  /**
   * Retrieve UPS entities with pagination.
   *
   * @param page - page number starting at 1
   * @param limit - number of items per page
   * @returns tuple of entities and total count
   */
  paginate(page: number, limit: number): Promise<[Ups[], number]>;
}
