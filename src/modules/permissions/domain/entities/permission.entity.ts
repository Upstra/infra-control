import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('permission')
export abstract class Permission extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowWrite!: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  allowRead!: boolean;
}
