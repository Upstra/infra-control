import { Ilo } from '../entities/ilo.entity';

export interface IloRepositoryInterface {
  save(entity: Ilo): Promise<Ilo>;
  findIloById(id: string): Promise<Ilo>;
  deleteIlo(id: string): Promise<void>;
}
