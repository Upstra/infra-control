import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardPreference } from '../../domain/entities/dashboard-preference.entity';
import { IDashboardPreferenceRepository } from '../../domain/interfaces/dashboard-preference.repository.interface';

@Injectable()
export class DashboardPreferenceRepository
  implements IDashboardPreferenceRepository
{
  constructor(
    @InjectRepository(DashboardPreference)
    private readonly repository: Repository<DashboardPreference>,
  ) {}

  async findByUserId(userId: string): Promise<DashboardPreference | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async save(
    preference: Partial<DashboardPreference>,
  ): Promise<DashboardPreference> {
    return this.repository.save(preference);
  }

  async create(
    preference: Partial<DashboardPreference>,
  ): Promise<DashboardPreference> {
    const defaultPreference = {
      refreshInterval: 30000,
      theme: 'light' as const,
      notifications: { alerts: true, activities: false },
      ...preference,
    };
    const entity = this.repository.create(defaultPreference);
    return this.repository.save(entity);
  }

  async upsert(
    preference: Partial<DashboardPreference>,
  ): Promise<DashboardPreference> {
    const existing = await this.findByUserId(preference.userId!);

    if (existing) {
      Object.assign(existing, preference);
      return this.repository.save(existing);
    } else {
      const newPreference = this.repository.create(preference);
      return this.repository.save(newPreference);
    }
  }
}
