import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SystemSettings,
  SystemSettingsData,
} from '../entities/system-settings.entity';
import { ISystemSettingsRepository } from '../interfaces/system-settings-repository.interface';
import { DefaultSettingsService } from './default-settings.service';
import { SystemSettingsNotFoundException } from '../exceptions/system-settings.exceptions';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';

@Injectable()
export class SystemSettingsService {
  private cache: SystemSettings | null = null;
  private cacheExpiry: Date | null = null;
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly repository: ISystemSettingsRepository,
    private readonly defaultSettingsService: DefaultSettingsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(LogHistoryUseCase)
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async getSettings(): Promise<SystemSettings> {
    if (this.cache && this.cacheExpiry && this.cacheExpiry > new Date()) {
      return this.cache;
    }

    let settings = await this.repository.findSettings();

    if (!settings) {
      settings = new SystemSettings();
      settings.id = 'singleton';
      settings.settings = this.defaultSettingsService.getDefaultSettings();
      settings = await this.repository.createSettings(settings);
    }

    this.cache = settings;
    this.cacheExpiry = new Date(Date.now() + this.cacheTTL);

    return settings;
  }

  async updateSettings(
    updates: Partial<SystemSettingsData>,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SystemSettings> {
    const settings = await this.getSettings();
    const oldSettings = JSON.parse(JSON.stringify(settings.settings));

    settings.settings = this.deepMerge(settings.settings, updates);
    settings.updatedById = userId;

    const updatedSettings = await this.repository.updateSettings(settings);

    this.invalidateCache();

    await this.logHistoryUseCase.executeStructured({
      entity: 'system_settings',
      entityId: 'singleton',
      action: 'UPDATE',
      userId,
      oldValue: oldSettings,
      newValue: updatedSettings.settings,
      metadata: { updatedFields: Object.keys(updates) },
      ipAddress,
      userAgent,
    });

    this.eventEmitter.emit('system-settings.updated', {
      settings: updatedSettings,
      changes: updates,
      userId,
    });

    return updatedSettings;
  }

  async resetCategory(
    category: keyof SystemSettingsData,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SystemSettings> {
    const settings = await this.getSettings();
    const oldCategory = JSON.parse(JSON.stringify(settings.settings[category]));
    const defaultCategory =
      this.defaultSettingsService.getDefaultCategory(category);

    settings.settings[category] = defaultCategory;
    settings.updatedById = userId;

    const updatedSettings = await this.repository.updateSettings(settings);

    this.invalidateCache();

    await this.logHistoryUseCase.executeStructured({
      entity: 'system_settings',
      entityId: 'singleton',
      action: 'RESET',
      userId,
      oldValue: { [category]: oldCategory },
      newValue: { [category]: defaultCategory },
      metadata: { resetCategory: category },
      ipAddress,
      userAgent,
    });

    this.eventEmitter.emit('system-settings.category-reset', {
      category,
      userId,
    });

    return updatedSettings;
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}
