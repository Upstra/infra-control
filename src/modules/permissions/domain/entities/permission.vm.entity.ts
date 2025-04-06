import { Entity, JoinColumn, ManyToMany, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';

@Entity('permission_vm')
export class PermissionVm extends Permission {
  @ApiProperty({ type: () => Vm, isArray: true })
  @ManyToMany(() => Vm, (vm) => vm.permissions)
  @JoinColumn()
  vms: Vm[];

  @ApiProperty({ type: () => Role, isArray: true })
  @OneToMany(() => Role, (role) => role.permissionVm)
  roles: Role[];
}
