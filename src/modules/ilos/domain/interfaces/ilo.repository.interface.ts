import { Ilo } from '../entities/ilo.entity';

export interface IloRepositoryInterface {
  save(entity: Ilo): Promise<Ilo>;
  findIloById(id: string): Promise<Ilo>;
  updateIlo(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo>;
  deleteIlo(id: string): Promise<void>;
}
