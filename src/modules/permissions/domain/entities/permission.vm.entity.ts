import { Entity, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Permission } from './permission.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Role } from '../../../roles/domain/entities/role.entity';

@Entity('permission_vm')
export class PermissionVm extends Permission {
  @ManyToOne(() => Role, (role) => role.permissionVms, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Vm, (vm) => vm.permissions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vmId' })
  vm?: Vm | null;

  @Column({ type: 'uuid', nullable: true })
  vmId?: string | null;
}
