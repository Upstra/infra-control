import { Ups } from '../entities/ups.entity';
import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';

export interface UpsRepositoryInterface
  extends GenericRepositoryInterface<Ups> {
  findUpsById(id: string): Promise<Ups | null>;
  updateUps(ups: Ups): Promise<Ups>;
  deleteUps(id: string): Promise<void>;
}
