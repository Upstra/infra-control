import { Injectable, Inject } from '@nestjs/common';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';

@Injectable()
export class CreateGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(groupDto: GroupVmDto): Promise<GroupVmDto> {
    throw new Error(`Method not implemented : ${groupDto}`);
  }
}
