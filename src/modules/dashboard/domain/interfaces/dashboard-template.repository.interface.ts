import { DashboardTemplate } from '../entities/dashboard-template.entity';

export interface IDashboardTemplateRepository {
  findAll(): Promise<DashboardTemplate[]>;
  findById(id: string): Promise<DashboardTemplate | null>;
  save(template: DashboardTemplate): Promise<DashboardTemplate>;
}
