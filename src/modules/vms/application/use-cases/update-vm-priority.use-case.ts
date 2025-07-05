import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../domain/entities/vm.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class UpdateVmPriorityUseCase {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    vmId: string,
    priority: number,
    userId: string,
  ): Promise<{ id: string; priority: number }> {
    const vm = await this.vmRepository.findOne({
      where: { id: vmId },
    });

    if (!vm) {
      throw new NotFoundException(`VM with id "${vmId}" not found`);
    }

    vm.priority = priority;

    await this.vmRepository.save(vm);
    await this.logHistory.execute('vm', vm.id, 'UPDATE', userId);

    return {
      id: vm.id,
      priority: vm.priority,
    };
  }
}