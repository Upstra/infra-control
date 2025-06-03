import { PermissionServer } from '../../domain/entities/permission.server.entity';
import { PermissionRepositoryInterface } from './permission.repository.interface';

export interface PermissionServerRepositoryInterface
  extends PermissionRepositoryInterface<PermissionServer> {}
