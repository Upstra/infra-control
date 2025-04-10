import { BaseEntity, Column, PrimaryColumn } from 'typeorm';

export abstract class Permission extends BaseEntity {
  @PrimaryColumn()
  roleId!: string;

  @Column({ type: 'boolean', default: false })
  allowWrite!: boolean;

  @Column({ type: 'boolean', default: false })
  allowRead!: boolean;
}
