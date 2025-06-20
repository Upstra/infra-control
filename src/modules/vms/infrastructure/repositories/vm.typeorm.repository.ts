import { Injectable, Logger } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  VmDeletionException,
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
  findOneByField<K extends keyof Vm>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<Vm, K>): Promise<Vm | null> {
    if (value === undefined || value === null) {
      throw new Error(`Invalid query value for field: ${String(field)}`);
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
      return await super.find({
        relations: ['permissions'],
      });
    } catch (error) {
      Logger.error('Error retrieving all VMs:', error);
      throw new VmRetrievalException();
    }
  }

  async findVmById(id: string): Promise<Vm> {
    const vm = await this.findOne({
      where: { id },
      relations: ['permissions'],
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
}
