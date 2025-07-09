import { Injectable, Inject } from '@nestjs/common';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences.repository.interface';

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @Inject('IUserPreferencesRepository')
    private readonly userPreferencesRepository: IUserPreferencesRepository,
  ) {}

  async execute(userId: string): Promise<UserPreference> {
    const preferences =
      await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      const defaultPreferences = UserPreference.createDefault(userId);
      return await this.userPreferencesRepository.create(defaultPreferences);
    }

    return preferences;
  }
}
