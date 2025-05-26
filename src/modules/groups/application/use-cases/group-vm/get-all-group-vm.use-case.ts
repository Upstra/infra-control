import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';

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
