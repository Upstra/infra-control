import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../roles/domain/entities/role.entity';

@Entity('user')
export class User extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'varchar' })
  username!: string;

  @ApiProperty()
  @Column({ type: 'varchar' })
  password!: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  email: string;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ApiProperty()
  @Column()
  roleId!: number;
}
