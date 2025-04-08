import { Ilo } from '../entities/ilo.entity';

export interface IloRepositoryInterface {
  findIloById(id: string): Promise<Ilo>;
  createIlo(
    id: string,
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
