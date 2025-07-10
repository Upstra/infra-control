import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../../domain/entities/user-preference.entity';
import { IUserPreferencesRepository } from '../../domain/interfaces/user-preferences.repository.interface';

@Injectable()
export class UserPreferencesRepository implements IUserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreference)
    private readonly repository: Repository<UserPreference>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreference | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async create(preference: UserPreference): Promise<UserPreference> {
    return this.repository.save(preference);
  }

  async update(preference: UserPreference): Promise<UserPreference> {
    return this.repository.save(preference);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
