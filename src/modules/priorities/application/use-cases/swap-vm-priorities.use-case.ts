import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { SwapVmResponseDto } from '../dto/swap-response.dto';
import { GetUserVmPermissionsUseCase } from '../../../permissions/application/use-cases/permission-vm';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { PermissionBit } from '../../../permissions/domain/value-objects/permission-bit.enum';

@Injectable()
export class SwapVmPrioritiesUseCase {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    private readonly getUserPermissionVm: GetUserVmPermissionsUseCase,
    private readonly logHistory: LogHistoryUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    vm1Id: string,
    vm2Id: string,
    userId: string,
  ): Promise<SwapVmResponseDto> {
    const permissions = await this.getUserPermissionVm.execute(userId);
    const permissionMap = new Map(permissions.map((p) => [p.vmId, p.bitmask]));

    const perm1 = permissionMap.get(vm1Id);
    const perm2 = permissionMap.get(vm2Id);

    const hasWritePermission = (bitmask: number | undefined) =>
      bitmask !== undefined &&
      (bitmask & PermissionBit.WRITE) === PermissionBit.WRITE;

    if (!hasWritePermission(perm1) || !hasWritePermission(perm2)) {
      throw new ForbiddenException(
        'You do not have write permissions on both VMs',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const vmRepo = manager.getRepository(Vm);

      const vm1 = await vmRepo.findOne({ where: { id: vm1Id } });
      const vm2 = await vmRepo.findOne({ where: { id: vm2Id } });

      if (!vm1) {
        throw new NotFoundException(`VM with id "${vm1Id}" not found`);
      }
      if (!vm2) {
        throw new NotFoundException(`VM with id "${vm2Id}" not found`);
      }

      const vm1OriginalPriority = vm1.priority;
      const vm2OriginalPriority = vm2.priority;

      vm1.priority = vm2OriginalPriority;
      vm2.priority = vm1OriginalPriority;

      await vmRepo.save([vm1, vm2]);

      await this.logHistory.executeStructured({
        entity: 'vm',
        entityId: vm1.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: vm1OriginalPriority },
        newValue: { priority: vm1.priority },
        metadata: {
          swapPartner: vm2.id,
          swapPartnerName: vm2.name,
          vmServerId: vm1.serverId,
          oldPriority: vm1OriginalPriority,
          newPriority: vm1.priority,
        },
      });

      await this.logHistory.executeStructured({
        entity: 'vm',
        entityId: vm2.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: vm2OriginalPriority },
        newValue: { priority: vm2.priority },
        metadata: {
          swapPartner: vm1.id,
          swapPartnerName: vm1.name,
          vmServerId: vm2.serverId,
          oldPriority: vm2OriginalPriority,
          newPriority: vm2.priority,
        },
      });

      return {
        vm1: { id: vm1.id, priority: vm1.priority },
        vm2: { id: vm2.id, priority: vm2.priority },
      };
    });
  }
}
