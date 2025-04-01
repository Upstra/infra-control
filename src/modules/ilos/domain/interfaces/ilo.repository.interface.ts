import { Ilo } from '../entities/ilo.entity';

export interface IloRepositoryInterface {
  findAll(): Promise<Ilo[]>;
  findIloById(id: number): Promise<Ilo | null>;
  createIlo(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo>;
  updateIlo(
    id: number,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo>;
  deleteIlo(id: number): Promise<void>;
}
