import { DashboardPreference } from '../entities/dashboard-preference.entity';

export interface IDashboardPreferenceRepository {
  findByUserId(userId: string): Promise<DashboardPreference | null>;
  save(preference: DashboardPreference): Promise<DashboardPreference>;
  upsert(
    preference: Partial<DashboardPreference>,
  ): Promise<DashboardPreference>;
}
