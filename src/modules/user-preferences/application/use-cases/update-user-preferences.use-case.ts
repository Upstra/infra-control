import { Injectable, Inject } from '@nestjs/common';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences.repository.interface';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { UserPreferencesExceptions } from '../../domain/exceptions/user-preferences.exception';
import { validateTimezone } from '../../domain/value-objects/timezone.validator';

@Injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @Inject('IUserPreferencesRepository')
    private readonly userPreferencesRepository: IUserPreferencesRepository,
  ) {}

  async execute(
    userId: string,
    updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreference> {
    const preferences = await this.getOrCreatePreferences(userId);

    this.applyUpdates(preferences, updateDto);

    try {
      return await this.userPreferencesRepository.update(preferences);
    } catch {
      throw UserPreferencesExceptions.failedToUpdate();
    }
  }

  private async getOrCreatePreferences(
    userId: string,
  ): Promise<UserPreference> {
    let preferences = await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      preferences = UserPreference.createDefault(userId);
      preferences = await this.userPreferencesRepository.create(preferences);
    }

    return preferences;
  }

  private applyUpdates(
    preferences: UserPreference,
    updateDto: UpdateUserPreferencesDto,
  ): void {
    this.updateBasicFields(preferences, updateDto);
    this.updateComplexFields(preferences, updateDto);
  }

  private updateBasicFields(
    preferences: UserPreference,
    updateDto: UpdateUserPreferencesDto,
  ): void {
    if (updateDto.locale !== undefined) {
      preferences.locale = updateDto.locale;
    }

    if (updateDto.theme !== undefined) {
      preferences.theme = updateDto.theme;
    }

    if (updateDto.timezone !== undefined) {
      if (!validateTimezone(updateDto.timezone)) {
        throw UserPreferencesExceptions.invalidTimezone(updateDto.timezone);
      }
      preferences.timezone = updateDto.timezone;
    }
  }

  private updateComplexFields(
    preferences: UserPreference,
    updateDto: UpdateUserPreferencesDto,
  ): void {
    if (updateDto.notifications) {
      preferences.notifications = {
        ...preferences.notifications,
        ...updateDto.notifications,
      };
    }

    if (updateDto.display) {
      preferences.display = {
        ...preferences.display,
        ...updateDto.display,
      };
    }

    if (updateDto.integrations) {
      preferences.integrations = this.mergeIntegrations(
        preferences.integrations,
        updateDto.integrations,
      );
    }

    if (updateDto.performance) {
      preferences.performance = {
        ...preferences.performance,
        ...updateDto.performance,
      };
    }
  }

  private mergeIntegrations(
    current: UserPreference['integrations'],
    updates: UpdateUserPreferencesDto['integrations'],
  ): UserPreference['integrations'] {
    const integrations = { ...current };
    const webhookFields = [
      'slackWebhook',
      'discordWebhook',
      'teamsWebhook',
      'alertEmail',
    ] as const;

    webhookFields.forEach((field) => {
      if (updates[field] !== undefined) {
        integrations[field] = updates[field] || undefined;
      }
    });

    return integrations;
  }
}
