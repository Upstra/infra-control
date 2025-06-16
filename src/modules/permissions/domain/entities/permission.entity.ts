import { BaseEntity, Column, PrimaryColumn } from 'typeorm';

export abstract class Permission extends BaseEntity {
  @PrimaryColumn()
  roleId!: string;

  @Column({ type: 'int', default: 0 })
  bitmask: number;
}
