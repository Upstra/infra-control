import { SystemSettings } from '../entities/system-settings.entity';

export interface ISystemSettingsRepository {
  findSettings(): Promise<SystemSettings | null>;
  createSettings(settings: SystemSettings): Promise<SystemSettings>;
  updateSettings(settings: SystemSettings): Promise<SystemSettings>;
}