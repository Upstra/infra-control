import { Injectable, Logger } from '@nestjs/common';
import { Ups } from '../../domain/entities/ups.entity';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  UpsInvalidQueryException,
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
      throw new UpsInvalidQueryException(String(field));
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

  /**
   * Paginate UPS entities.
   *
   * @param page - page number starting at 1
   * @param limit - items per page
   */
  async paginate(page: number, limit: number): Promise<[Ups[], number]> {
    return this.findAndCount({
      relations: ['servers'],
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
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

  async findAllWithServerCount(): Promise<
    Array<{ ups: Ups; serverCount: number }>
  > {
    try {
      const upsWithCount = await this.createQueryBuilder('ups')
        .leftJoinAndSelect('ups.servers', 'server')
        .loadRelationCountAndMap('ups.serverCount', 'ups.servers')
        .getMany();

      return upsWithCount.map((ups) => ({
        ups,
        serverCount: (ups as any).serverCount ?? 0,
      }));
    } catch (error) {
      Logger.error('Error retrieving UPS with server count:', error);
      throw new UpsRetrievalException();
    }
  }

  async paginateWithServerCount(
    page: number,
    limit: number,
  ): Promise<[Array<{ ups: Ups; serverCount: number }>, number]> {
    try {
      const [upsWithCount, total] = await this.createQueryBuilder('ups')
        .leftJoinAndSelect('ups.servers', 'server')
        .loadRelationCountAndMap('ups.serverCount', 'ups.servers')
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('ups.name', 'ASC')
        .getManyAndCount();

      const result = upsWithCount.map((ups) => ({
        ups,
        serverCount: (ups as any).serverCount ?? 0,
      }));

      return [result, total];
    } catch (error) {
      Logger.error('Error paginating UPS with server count:', error);
      throw new UpsRetrievalException();
    }
  }

  async findByIdWithServerCount(
    id: string,
  ): Promise<{ ups: Ups; serverCount: number } | null> {
    try {
      const ups = await this.createQueryBuilder('ups')
        .leftJoinAndSelect('ups.servers', 'server')
        .loadRelationCountAndMap('ups.serverCount', 'ups.servers')
        .where('ups.id = :id', { id })
        .getOne();

      if (!ups) {
        return null;
      }

      return {
        ups,
        serverCount: (ups as any).serverCount ?? 0,
      };
    } catch (error) {
      Logger.error('Error retrieving UPS by ID with server count:', error);
      throw new UpsRetrievalException();
    }
  }
}
