import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';

@Injectable()
export class GetGroupVmByIdUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<GroupVmDto> {
    const group = await this.groupRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['vms'],
    });

    return new GroupVmDto(group);
  }
}
