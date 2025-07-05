import { DashboardLayout } from '../entities/dashboard-layout.entity';

export interface IDashboardLayoutRepository {
  findByUserId(userId: string): Promise<DashboardLayout[]>;
  findById(id: string): Promise<DashboardLayout | null>;
  findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<DashboardLayout | null>;
  findDefaultByUserId(userId: string): Promise<DashboardLayout | null>;
  save(layout: DashboardLayout): Promise<DashboardLayout>;
  delete(id: string): Promise<void>;
  setDefaultLayout(layoutId: string, userId: string): Promise<void>;
  unsetAllDefaultLayouts(userId: string): Promise<void>;
}
