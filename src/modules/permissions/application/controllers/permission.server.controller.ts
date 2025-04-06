import { Controller } from '@nestjs/common';
import { PermissionController } from '../interfaces/permission.controller';
import { PermissionServerService } from '../services/permission.server.service.service';

@Controller('permission/server')
export class PermissionServerController extends PermissionController {
  constructor(protected readonly permissionService: PermissionServerService) {
    super(permissionService);
  }
}
