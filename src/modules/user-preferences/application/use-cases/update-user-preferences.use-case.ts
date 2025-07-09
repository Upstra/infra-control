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
    let preferences = await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      preferences = UserPreference.createDefault(userId);
    }

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
      const integrations = { ...preferences.integrations };

      if (updateDto.integrations.slackWebhook !== undefined) {
        integrations.slackWebhook = updateDto.integrations.slackWebhook || undefined;
      }
      if (updateDto.integrations.discordWebhook !== undefined) {
        integrations.discordWebhook = updateDto.integrations.discordWebhook || undefined;
      }
      if (updateDto.integrations.teamsWebhook !== undefined) {
        integrations.teamsWebhook = updateDto.integrations.teamsWebhook || undefined;
      }
      if (updateDto.integrations.alertEmail !== undefined) {
        integrations.alertEmail = updateDto.integrations.alertEmail || undefined;
      }

      preferences.integrations = integrations;
    }

    if (updateDto.performance) {
      preferences.performance = {
        ...preferences.performance,
        ...updateDto.performance,
      };
    }

    try {
      return await this.userPreferencesRepository.update(preferences);
    } catch (error) {
      throw UserPreferencesExceptions.failedToUpdate();
    }
  }
}