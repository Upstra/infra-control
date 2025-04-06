import { Controller } from '@nestjs/common';
import { GroupController } from '../interfaces/group.controller';
import { GroupServerService } from '../services/group.server.service';

@Controller('group/server')
export class GroupServerController extends GroupController {
  constructor(protected readonly groupService: GroupServerService) {
    super(groupService);
  }
}
