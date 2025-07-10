import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../../domain/entities/system-settings.entity';
import { ISystemSettingsRepository } from '../../domain/interfaces/system-settings-repository.interface';

@Injectable()
export class SystemSettingsRepository implements ISystemSettingsRepository {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly repository: Repository<SystemSettings>,
  ) {}

  async findSettings(): Promise<SystemSettings | null> {
    return await this.repository.findOne({
      where: { id: 'singleton' },
      relations: ['updatedBy'],
    });
  }

  async createSettings(settings: SystemSettings): Promise<SystemSettings> {
    return await this.repository.save(settings);
  }

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    return await this.repository.save(settings);
  }
}