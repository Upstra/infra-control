import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';
import { DashboardWidget } from './dashboard-widget.entity';

@Entity('dashboard_layouts')
export class DashboardLayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', default: 12 })
  columns: number;

  @Column({ name: 'row_height', type: 'int', default: 80 })
  rowHeight: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => DashboardWidget, (widget) => widget.layout, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  widgets: DashboardWidget[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
