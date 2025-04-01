import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/domain/entities/user.entity';

@Entity('role')
export class Role extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  name!: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowWriteServer!: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowReadServer!: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowWriteVM!: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowReadVM!: boolean;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
