import { Injectable, Inject } from '@nestjs/common';
import { GroupVmDto } from '../../dto/group.vm.dto';
import { GroupVmRepositoryInterface } from '@/modules/groups/domain/interfaces/group-vm.repository.interface';
import { GroupVmDomainService } from '@/modules/groups/domain/services/group.vm.domain.service';

@Injectable()
export class CreateGroupVmUseCase {
  constructor(
    @Inject('GroupVmRepositoryInterface')
    private readonly groupRepository: GroupVmRepositoryInterface,
    private readonly domain: GroupVmDomainService,
  ) {}

  async execute(groupDto: GroupVmDto): Promise<GroupVmDto> {
    const entity = this.domain.createGroup(groupDto);
    const created = await this.groupRepository.save(entity);

    return new GroupVmDto(created);
  }
}
