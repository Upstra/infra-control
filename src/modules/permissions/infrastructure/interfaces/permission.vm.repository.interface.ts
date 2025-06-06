import { PermissionVm } from '../../domain/entities/permission.vm.entity';
import { PermissionRepositoryInterface } from './permission.repository.interface';

export interface PermissionVmRepositoryInterface
  extends PermissionRepositoryInterface<PermissionVm> {}
