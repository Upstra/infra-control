import { UserPreference } from '../entities/user-preference.entity';

export interface IUserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreference | null>;
  create(preference: UserPreference): Promise<UserPreference>;
  update(preference: UserPreference): Promise<UserPreference>;
  delete(id: string): Promise<void>;
}