import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/domain/entities/user.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

@Entity('role')
export class Role extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty({ type: () => User, isArray: true })
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @ApiProperty({ type: () => PermissionServer })
  @ManyToOne(() => PermissionServer, (permission) => permission.roles)
  @JoinColumn({ name: 'permissionServerId' })
  permissionServer: PermissionServer;

  @ApiProperty()
  @Column()
  permissionServerId!: number;

  @ApiProperty({ type: () => PermissionVm })
  @ManyToOne(() => PermissionVm, (permission) => permission.roles)
  @JoinColumn({ name: 'permissionVmId' })
  permissionVm: PermissionVm;

  @ApiProperty()
  @Column()
  permissionVmId!: number;
}
