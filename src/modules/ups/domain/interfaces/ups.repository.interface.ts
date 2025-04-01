import { Ups } from '../entities/ups.entity';

export interface UpsRepositoryInterface {
  findAll(): Promise<Ups[]>;
  findUpsById(id: number): Promise<Ups | null>;
  createUps(
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
    ups_agent: string,
  ): Promise<Ups>;
  updateUps(
    id: number,
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
    ups_agent: string,
  ): Promise<Ups>;
  deleteUps(id: number): Promise<void>;
}
