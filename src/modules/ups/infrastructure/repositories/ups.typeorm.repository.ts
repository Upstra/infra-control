import { Injectable } from '@nestjs/common';
import { Ups } from '../../domain/entities/ups.entity';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { UpsNotFoundException } from '@/modules/ups/domain/exceptions/ups.notfound.exception';

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
    const ups = await this.findOne({
      where: { id },
      relations: ['servers'],
    });
    if (!ups) {
      throw new UpsNotFoundException(id);
    }
    return ups;
  }

  async createUps(
    name: string,
    ip: string,
    login: string,
    password: string,
    grace_period_on: number,
    grace_period_off: number,
    roomId: string,
  ): Promise<Ups> {
    const ups = this.create({
      name,
      ip,
      login,
      password,
      grace_period_on,
      grace_period_off,
      servers: [],
      roomId,
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
    roomId: string,
  ): Promise<Ups> {
    const ups = await this.findUpsById(id);
    ups.name = name ? name : ups.name;
    ups.ip = ip ? ip : ups.ip;
    ups.login = login ? login : ups.login;
    ups.password = password ? password : ups.password;
    ups.grace_period_on = grace_period_on
      ? grace_period_on
      : ups.grace_period_on;
    ups.grace_period_off = grace_period_off
      ? grace_period_off
      : ups.grace_period_off;
    ups.roomId = roomId ? roomId : ups.roomId;
    await this.save(ups);
    return ups;
  }

  async deleteUps(id: string): Promise<void> {
    await this.findUpsById(id);
    await this.delete(id);
  }
}
