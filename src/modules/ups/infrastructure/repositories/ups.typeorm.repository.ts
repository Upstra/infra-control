import { Injectable, Logger } from '@nestjs/common';
import { Ups } from '../../domain/entities/ups.entity';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  UpsNotFoundException,
  UpsRetrievalException,
  UpsUpdateException,
} from '../../domain/exceptions/ups.exception';
import { FindOneByFieldOptions } from '@/core/utils';

@Injectable()
export class UpsTypeormRepository
  extends Repository<Ups>
  implements UpsRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Ups, dataSource.createEntityManager());
  }

  async findOneByField<T extends keyof Ups>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<Ups, T>): Promise<Ups> {
    if (value === undefined || value === null) {
      throw new Error(`Invalid value for ${String(field)}`);
    }
    return this.findOne({
      where: { [field]: value },
      relations,
    }).then((ups) => {
      if (!ups && !disableThrow) {
        throw new UpsNotFoundException(String(value));
      }
      return ups;
    });
  }

  async findAll(): Promise<Ups[]> {
    try {
      return await this.find({
        relations: ['servers'],
      });
    } catch (error) {
      Logger.error('Error retrieving all UPS entities:', error);
      throw new UpsRetrievalException();
    }
  }

  async findUpsById(id: string): Promise<Ups> {
    try {
      return await this.findOneOrFail({
        where: { id },
        relations: ['servers'],
      });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new UpsNotFoundException(id);
      }

      Logger.error('Error retrieving UPS entity by ID:', error);
      throw new UpsRetrievalException();
    }
  }

  async updateUps(ups: Ups): Promise<Ups> {
    try {
      const saved = await this.save(ups);
      return Array.isArray(saved) ? saved[0] : saved;
    } catch (error) {
      Logger.error('Error updating UPS entity:', error);
      throw new UpsUpdateException();
    }
  }

  async deleteUps(id: string): Promise<void> {
    try {
      await this.delete(id);
    } catch (error) {
      Logger.error('Error deleting UPS entity:', error);
      throw new UpsNotFoundException(id);
    }
  }
}
