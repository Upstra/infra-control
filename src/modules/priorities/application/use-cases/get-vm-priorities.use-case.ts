import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { VmPriorityResponseDto } from '../dto/vm-priority-response.dto';
import { GetUserVmPermissionsUseCase } from '../../../permissions/application/use-cases/permission-vm';
import { PermissionBit } from '../../../permissions/domain/value-objects/permission-bit.enum';
@Injectable()
export class GetVmPrioritiesUseCase {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    private readonly getUserPermissionVm: GetUserVmPermissionsUseCase,
  ) {}

  async execute(userId: string): Promise<VmPriorityResponseDto[]> {
    const permissions = await this.getUserPermissionVm.execute(userId);

    const vmIds = permissions
      .filter(
        (perm) => (perm.bitmask & PermissionBit.READ) === PermissionBit.READ,
      )
      .map((perm) => perm.vmId);

    if (vmIds.length === 0) {
      return [];
    }

    console.log('VM IDs:', vmIds);

    const vms = await this.vmRepository
      .createQueryBuilder('vm')
      .where('vm.id IN (:...ids)', { ids: vmIds })
      .orderBy('vm.priority', 'ASC')
      .addOrderBy('vm.name', 'ASC')
      .getMany();

    return vms.map((vm) => ({
      id: vm.id,
      name: vm.name,
      serverId: vm.serverId,
      priority: vm.priority,
      state: vm.state,
    }));
  }
}
