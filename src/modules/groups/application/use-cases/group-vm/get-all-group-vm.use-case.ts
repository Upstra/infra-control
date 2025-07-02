import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';

/**
 * Retrieves all VM groups with their VM listings.
 *
 * Delegates to the VM repository, then converts each GroupVm entity
 * into its DTO equivalent for client consumption.
 *
 * @returns {Promise<GroupVmDto[]>}
 *   An array of VM group DTOs containing group info and its VMs.
 *
 * @remarks
 * Read-only operation without extra domain logic.
 *
 * @example
 * const vmGroups = await getAllGroupVmUseCase.execute();
 */

@Injectable()
export class GetAllGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(): Promise<GroupVmDto[]> {
    const groups = await this.groupRepository.findAll();
    return groups.map((g: GroupVm) => new GroupVmDto(g));
  }
}
