import { Controller } from '@nestjs/common';
import { PermissionController } from '../interfaces/permission.controller';
import { PermissionVmService } from '../services/permission.vm.service';

@Controller('permission/vm')
export class PermissionVmController extends PermissionController {
  constructor(protected readonly permissionService: PermissionVmService) {
    super(permissionService);
  }
}
