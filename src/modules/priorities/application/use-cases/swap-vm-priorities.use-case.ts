import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { SwapVmResponseDto } from '../dto/swap-response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class SwapVmPrioritiesUseCase {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    private readonly logHistory: LogHistoryUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    vm1Id: string,
    vm2Id: string,
    userId: string,
  ): Promise<SwapVmResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const vmRepo = manager.getRepository(Vm);

      const vm1 = await vmRepo.findOne({
        where: { id: vm1Id },
        relations: ['server'],
      });
      const vm2 = await vmRepo.findOne({
        where: { id: vm2Id },
        relations: ['server'],
      });

      if (!vm1) {
        throw new NotFoundException(`VM with id ${vm1Id} not found`);
      }
      if (!vm2) {
        throw new NotFoundException(`VM with id ${vm2Id} not found`);
      }

      // Verify VMs are not on vCenter servers
      if (vm1.server?.type === 'vcenter' || vm2.server?.type === 'vcenter') {
        throw new BadRequestException('Cannot swap priorities for VMs on vCenter servers');
      }

      // Verify VMs are on the same server (for priority uniqueness)
      if (vm1.serverId !== vm2.serverId) {
        throw new BadRequestException('Cannot swap priorities between VMs on different servers');
      }

      // Swap priorities
      const temp = vm1.priority;
      vm1.priority = vm2.priority;
      vm2.priority = temp;

      await vmRepo.save([vm1, vm2]);

      // Log the swap
      await this.logHistory.execute(
        'vm',
        `${vm1Id}-${vm2Id}`,
        'SWAP_PRIORITY',
        userId,
      );

      return {
        vm1: { id: vm1.id, priority: vm1.priority },
        vm2: { id: vm2.id, priority: vm2.priority },
      };
    });
  }
}
