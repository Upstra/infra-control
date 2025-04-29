import { Injectable, Logger } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  VmDeletionException,
  VmNotFoundException,
  VmRetrievalException,
} from '../../domain/exceptions/vm.exception';

@Injectable()
export class VmTypeormRepository
  extends Repository<Vm>
  implements VmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Vm, dataSource.createEntityManager());
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
