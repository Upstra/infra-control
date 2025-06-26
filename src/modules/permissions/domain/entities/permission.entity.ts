import { BaseEntity, Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class Permission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  roleId!: string;

  @Column({ type: 'int', default: 0 })
  bitmask: number;
}
