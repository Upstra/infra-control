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
  /**
   * Retrieve all UPS entities with server count.
   *
   * @returns array of UPS entities with server count
   */
  findAllWithServerCount(): Promise<Array<{ ups: Ups; serverCount: number }>>;
  /**
   * Retrieve UPS entities with pagination and server count.
   *
   * @param page - page number starting at 1
   * @param limit - number of items per page
   * @returns tuple of entities with server count and total count
   */
  paginateWithServerCount(
    page: number,
    limit: number,
  ): Promise<[Array<{ ups: Ups; serverCount: number }>, number]>;
  /**
   * Retrieve a single UPS with server count.
   *
   * @param id - UPS id
   * @returns UPS entity with server count or null
   */
  findByIdWithServerCount(
    id: string,
  ): Promise<{ ups: Ups; serverCount: number } | null>;
}
