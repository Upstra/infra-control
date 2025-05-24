import { Injectable, Inject } from '@nestjs/common';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupNotFoundException } from '@/modules/groups/domain/exceptions/group.exception';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';

@Injectable()
export class UpdateGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
    private readonly domain: GroupVmDomainService,
  ) {}

  async execute(id: string, groupDto: GroupVmDto): Promise<GroupVmDto> {
    const existing = await this.groupRepository.findGroupById(id);
    if (!existing) throw new GroupNotFoundException('vm', id);

    const entity = this.domain.updateGroupEntityFromDto(existing, groupDto);

    const updated = await this.groupRepository.save(entity);

    return new GroupVmDto(updated);
  }
}
