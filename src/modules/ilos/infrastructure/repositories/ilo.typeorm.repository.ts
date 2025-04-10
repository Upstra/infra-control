import { Injectable } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Ilo } from '../../domain/entities/ilo.entity';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';

@Injectable()
export class IloTypeormRepository
  extends Repository<Ilo>
  implements IloRepositoryInterface {
  constructor(private readonly dataSource: DataSource) {
    super(Ilo, dataSource.createEntityManager());
  }

  async findIloById(id: string): Promise<Ilo> {
    const ilo = await this.findOne({
      where: { id },
    });
    if (!ilo) {
      throw new IloNotFoundException(id);
    }
    return ilo;
  }

  async deleteIlo(id: string): Promise<void> {
    await this.findIloById(id);
    await this.delete(id);
  }
}
