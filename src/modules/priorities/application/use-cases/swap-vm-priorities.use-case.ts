import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { SwapVmResponseDto } from '../dto/swap-response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { GenerateMigrationPlanUseCase } from './generate-migration-plan.use-case';

@Injectable()
export class SwapVmPrioritiesUseCase {
  constructor(
    private readonly logHistory: LogHistoryUseCase,
    private readonly generateMigrationPlan: GenerateMigrationPlanUseCase,
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

      if (vm1.server?.type === 'vcenter' || vm2.server?.type === 'vcenter') {
        throw new BadRequestException(
          'Cannot swap priorities for VMs on vCenter servers',
        );
      }

      if (vm1.serverId !== vm2.serverId) {
        throw new BadRequestException(
          'Cannot swap priorities between VMs on different servers',
        );
      }

      const temp = vm1.priority;
      vm1.priority = vm2.priority;
      vm2.priority = temp;

      await vmRepo.save([vm1, vm2]);

      await this.logHistory.execute(
        'vm',
        `${vm1Id}-${vm2Id}`,
        'SWAP_PRIORITY',
        userId,
      );

      await this.generateMigrationPlan.execute();

      return {
        vm1: { id: vm1.id, priority: vm1.priority },
        vm2: { id: vm2.id, priority: vm2.priority },
      };
    });
  }
}
