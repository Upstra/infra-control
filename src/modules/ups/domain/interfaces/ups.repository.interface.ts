import { UpsUpdateDto } from '../../application/dto/ups.update.dto';
import { Ups } from '../entities/ups.entity';

export interface UpsRepositoryInterface {
  findAll(): Promise<Ups[]>;
  findUpsById(id: string): Promise<Ups | null>;
  createUps(
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
    roomId: string,
  ): Promise<Ups>;
  updateUps(id: string, updateDto: UpsUpdateDto): Promise<Ups>;
  deleteUps(id: string): Promise<void>;
}
