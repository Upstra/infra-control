import { DashboardPreference } from '../entities/dashboard-preference.entity';

export interface IDashboardPreferenceRepository {
  findByUserId(userId: string): Promise<DashboardPreference | null>;
  save(preference: Partial<DashboardPreference>): Promise<DashboardPreference>;
  create(preference: Partial<DashboardPreference>): Promise<DashboardPreference>;
  upsert(
    preference: Partial<DashboardPreference>,
  ): Promise<DashboardPreference>;
}
