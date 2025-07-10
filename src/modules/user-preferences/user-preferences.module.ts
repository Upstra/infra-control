import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from './domain/entities/user-preference.entity';
import { UserPreferencesRepository } from './infrastructure/repositories/user-preferences.repository';
import { UserPreferencesController } from './application/controllers/user-preferences.controller';
import {
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
  ResetUserPreferencesUseCase,
} from './application/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreference])],
  controllers: [UserPreferencesController],
  providers: [
    {
      provide: 'IUserPreferencesRepository',
      useClass: UserPreferencesRepository,
    },
    GetUserPreferencesUseCase,
    UpdateUserPreferencesUseCase,
    ResetUserPreferencesUseCase,
  ],
  exports: ['IUserPreferencesRepository', GetUserPreferencesUseCase],
})
export class UserPreferencesModule {}
