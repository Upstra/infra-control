import { Injectable } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Ilo } from '../../domain/entities/ilo.entity';
import { IloNotFoundException } from '../../domain/exceptions/ilo.exception';

@Injectable()
export class IloTypeormRepository
  extends Repository<Ilo>
  implements IloRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Ilo, dataSource.createEntityManager());
  }

  async updateIlo(entity: Ilo): Promise<Ilo> {
    const updateData: Partial<Ilo> = {
      name: entity.name,
      ip: entity.ip,
      login: entity.login,
    };

    if (entity.password) {
      updateData.password = entity.password;
    }

    await this.update(entity.id, updateData);
    return await this.findIloById(entity.id);
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

  async findIloByIdWithCredentials(id: string): Promise<Ilo> {
    const ilo = await this.createQueryBuilder('ilo')
      .addSelect('ilo.password')
      .where('ilo.id = :id', { id })
      .getOne();
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
