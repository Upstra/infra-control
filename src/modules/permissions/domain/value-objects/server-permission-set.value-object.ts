import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionSet } from './ permission-set.value-object';

export class ServerPermissionSet extends PermissionSet<PermissionServer> {
  getAccessibleServerIds(): string[] {
    return super.getAccessibleResourceIds();
  }
}
