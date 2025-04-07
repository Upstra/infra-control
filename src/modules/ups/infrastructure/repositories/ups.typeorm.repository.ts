import { Injectable } from '@nestjs/common';
import { Ups } from '../../domain/entities/ups.entity';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UpsTypeormRepository
  extends Repository<Ups>
  implements UpsRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Ups, dataSource.createEntityManager());
  }

  async findAll(): Promise<Ups[]> {
    return await this.find({
      relations: ['servers'],
    });
  }

  async findUpsById(id: string): Promise<Ups> {
    return await this.findOne({
      where: { id },
      relations: ['servers'],
    });
  }

  async createUps(
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
  ): Promise<Ups> {
    const ups = this.create({
      name,
      ip,
      login,
      password,
      grace_period_on,
      grace_period_off,
      servers: [],
    });
    return await this.save(ups);
  }

  async updateUps(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
  ): Promise<Ups> {
    const ups = await this.findUpsById(id);
    if (!ups) {
      throw new Error('Ups not found');
    }
    ups.name = name;
    ups.ip = ip;
    ups.login = login;
    ups.password = password;
    ups.grace_period_on = grace_period_on;
    ups.grace_period_off = grace_period_off;
    return await this.save(ups);
  }

  async deleteUps(id: string): Promise<void> {
    const ups = await this.findUpsById(id);
    if (!ups) {
      throw new Error('Ups not found');
    }
    await this.delete(id);
  }
}
