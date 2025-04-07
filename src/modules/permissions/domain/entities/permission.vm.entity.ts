import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';

@Entity('permission_vm')
export class PermissionVm extends Permission {
  @ManyToOne(() => Role, (role) => role.permissionVms)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Vm, (vm) => vm.permissions)
  @JoinColumn({ name: 'vmId' })
  vm: Vm;

  @PrimaryColumn()
  vmId!: string;
}
