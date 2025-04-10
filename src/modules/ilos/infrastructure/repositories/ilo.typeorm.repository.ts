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

  async findIloById(id: string): Promise<Ilo> {
    const ilo = await this.findOne({
      where: { id },
    });
    if (!ilo) {
      throw new IloNotFoundException(id);
    }
    return ilo;
  }

  async createIlo(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo> {
    const ilo = this.create({
      id,
      name,
      ip,
      login,
      password,
    });
    return await this.save(ilo);
  }

  async updateIlo(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo> {
    const ilo = await this.findIloById(id);
    ilo.name = name;
    ilo.ip = ip;
    ilo.login = login;
    ilo.password = password;
    return await this.save(ilo);
  }

  async deleteIlo(id: string): Promise<void> {
    await this.findIloById(id);
    await this.delete(id);
  }
}
