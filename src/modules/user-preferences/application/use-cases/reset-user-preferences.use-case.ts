import { Injectable, Inject } from '@nestjs/common';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences.repository.interface';
import { UserPreferencesExceptions } from '../../domain/exceptions/user-preferences.exception';

@Injectable()
export class ResetUserPreferencesUseCase {
  constructor(
    @Inject('IUserPreferencesRepository')
    private readonly userPreferencesRepository: IUserPreferencesRepository,
  ) {}

  async execute(userId: string): Promise<UserPreference> {
    let preferences = await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      preferences = UserPreference.createDefault(userId);
    } else {
      const defaultPreferences = UserPreference.createDefault(userId);
      preferences.locale = defaultPreferences.locale;
      preferences.theme = defaultPreferences.theme;
      preferences.timezone = defaultPreferences.timezone;
      preferences.notifications = defaultPreferences.notifications;
      preferences.display = defaultPreferences.display;
      preferences.integrations = defaultPreferences.integrations;
      preferences.performance = defaultPreferences.performance;
    }

    try {
      return await this.userPreferencesRepository.update(preferences);
    } catch (error) {
      throw UserPreferencesExceptions.failedToReset();
    }
  }
}