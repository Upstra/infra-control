import { Controller } from '@nestjs/common';
import { GroupVmService } from '@/modules/groups/application/services/group.vm.service';
import { GroupController } from '@/modules/groups/application/interfaces/group.controller';

@Controller('group/vm')
export class GroupVmController extends GroupController {
  constructor(protected readonly groupService: GroupVmService) {
    super(groupService);
  }
}
