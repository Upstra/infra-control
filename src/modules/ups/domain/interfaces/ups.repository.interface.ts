import { DeepPartial, SaveOptions } from 'typeorm';
import { Ups } from '../entities/ups.entity';

export interface UpsRepositoryInterface {
  save<T extends DeepPartial<Ups>>(
    entity: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]>;
  findAll(): Promise<Ups[]>;
  findUpsById(id: string): Promise<Ups | null>;
  updateUps(ups: Ups): Promise<Ups>;
  deleteUps(id: string): Promise<void>;
}
