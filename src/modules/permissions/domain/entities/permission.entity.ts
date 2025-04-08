import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permission')
export abstract class Permission extends BaseEntity {
  @PrimaryColumn()
  roleId!: string;

  @Column({ type: 'boolean', default: false })
  allowWrite!: boolean;

  @Column({ type: 'boolean', default: false })
  allowRead!: boolean;
}
