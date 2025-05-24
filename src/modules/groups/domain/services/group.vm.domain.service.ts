import { Injectable } from '@nestjs/common';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { GroupVmDto } from '../../application/dto/group.vm.dto';

@Injectable()
export class GroupVmDomainService {
  createGroup(dto: GroupVmDto): GroupVm {
    const groupVm = new GroupVm();
    groupVm.name = dto.name;
    groupVm.priority = dto.priority;
    return groupVm;
  }
}
