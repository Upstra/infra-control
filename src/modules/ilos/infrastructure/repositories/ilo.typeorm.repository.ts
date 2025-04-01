import { Injectable } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { Ilo } from '../../domain/entities/ilo.entity';

@Injectable()
export class IloTypeormRepository
  extends Repository<Ilo>
  implements IloRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Ilo, dataSource.createEntityManager());
  }

  async findAll(): Promise<Ilo[]> {
    return await this.find();
  }

  async findIloById(id: number): Promise<Ilo | null> {
    return await this.findOne({
      where: { id },
    });
  }

  async createIlo(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo> {
    const ilo = this.create({
      name,
      ip,
      login,
      password,
    });
    return await this.save(ilo);
  }

  async updateIlo(
    id: number,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Ilo> {
    const ilo = await this.findIloById(id);
    if (!ilo) {
      throw new Error('Ilo not found');
    }
    ilo.name = name;
    ilo.ip = ip;
    ilo.login = login;
    ilo.password = password;
    return await this.save(ilo);
  }

  async deleteIlo(id: number): Promise<void> {
    const ilo = await this.findIloById(id);
    if (!ilo) {
      throw new Error('Ilo not found');
    }
    await this.delete(id);
  }
}
