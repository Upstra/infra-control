import { Injectable } from '@nestjs/common';
import { Vm } from '../../domain/entities/vm.entity';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { VmNotFoundException } from '../../domain/exceptions/vm.exception';

@Injectable()
export class VmTypeormRepository
  extends Repository<Vm>
  implements VmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Vm, dataSource.createEntityManager());
  }

  async findAll(): Promise<Vm[]> {
    return await this.find({
      relations: ['permissions'],
    });
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
    await this.findVmById(id);
    await this.delete(id);
  }
}
