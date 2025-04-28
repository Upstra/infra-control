import { Injectable, Logger } from '@nestjs/common';
import { Ups } from '../../domain/entities/ups.entity';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { DataSource, DeepPartial, Repository, SaveOptions } from 'typeorm';
import {
  UpsCreationException,
  UpsNotFoundException,
  UpsRetrievalException,
  UpsUpdateException,
} from '../../domain/exceptions/ups.exception';

@Injectable()
export class UpsTypeormRepository
  extends Repository<Ups>
  implements UpsRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Ups, dataSource.createEntityManager());
  }

  async save<T extends DeepPartial<Ups>>(
    entity: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]> {
    try {
      if (Array.isArray(entity)) {
        return (await super.save(entity, options)) as T[];
      } else {
        return (await super.save(entity, options)) as T;
      }
    } catch (error) {
      Logger.error('Error saving UPS entity:', error);
      throw new UpsCreationException();
    }
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
