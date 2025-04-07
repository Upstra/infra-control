import { Ilo } from '../entities/ilo.entity';

export interface IloRepositoryInterface {
  findAll(): Promise<Ilo[]>;
  findIloById(id: string): Promise<Ilo | null>;
  createIlo(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo>;
  updateIlo(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo>;
  deleteIlo(id: string): Promise<void>;
}
