import { Injectable, Logger } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  VmDeletionException,
  VmInvalidQueryException,
  VmNotFoundException,
  VmRetrievalException,
} from '../../domain/exceptions/vm.exception';
import { FindOneByFieldOptions } from '@/core/utils';

@Injectable()
export class VmTypeormRepository
  extends Repository<Vm>
  implements VmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Vm, dataSource.createEntityManager());
  }
  /**
   * Find a VM entity by an arbitrary field.
   *
   * @param field - VM property to query by
   * @param value - expected value for the given field
   * @param disableThrow - when true, returns `null` instead of throwing on error
   * @param relations - optional relations to eager load
   */
  findOneByField<K extends keyof Vm>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<Vm, K>): Promise<Vm | null> {
    if (value === undefined || value === null) {
      throw new VmInvalidQueryException(String(field));
    }

    return this.findOne({
      where: { [field]: value },
      relations,
    }).catch((error) => {
      Logger.error(`Error finding VM by field ${String(field)}:`, error);
      if (!disableThrow) {
        throw new VmRetrievalException();
      }
      return null;
    });
  }
  async findAll(): Promise<Vm[]> {
    try {
      return await super.find();
    } catch (error) {
      Logger.error('Error retrieving all VMs:', error);
      throw new VmRetrievalException();
    }
  }

  async paginate(
    page: number,
    limit: number,
    serverId?: string,
  ): Promise<[Vm[], number]> {
    const queryBuilder = this.createQueryBuilder('vm')
      .orderBy('vm.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (serverId) {
      queryBuilder.where('vm.serverId = :serverId', { serverId });
    }

    return queryBuilder.getManyAndCount();
  }

  async findVmById(id: string): Promise<Vm> {
    const vm = await this.findOne({
      where: { id },
    });
    if (!vm) {
      throw new VmNotFoundException(id);
    }
    return vm;
  }

  async deleteVm(id: string): Promise<void> {
    try {
      await super.delete(id);
    } catch (error) {
      Logger.error('Error deleting VM:', error);
      throw new VmDeletionException();
    }
  }

  async countByState(state: 'UP' | 'DOWN'): Promise<number> {
    try {
      return await this.count({
        where: { state },
      });
    } catch (error) {
      Logger.error(`Error counting VMs with state ${state}:`, error);
      throw new VmRetrievalException();
    }
  }
}
