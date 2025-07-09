import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserPreferencesUseCase } from '../update-user-preferences.use-case';
import { IUserPreferencesRepository } from '../../../domain/interfaces/user-preferences.repository.interface';
import { UserPreference } from '../../../domain/entities/user-preference.entity';
import { UpdateUserPreferencesDto } from '../../dto/update-user-preferences.dto';
import { UserPreferencesExceptions } from '../../../domain/exceptions/user-preferences.exception';

describe('UpdateUserPreferencesUseCase', () => {
  let useCase: UpdateUserPreferencesUseCase;
  let mockRepository: jest.Mocked<IUserPreferencesRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserPreferencesUseCase,
        {
          provide: 'IUserPreferencesRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateUserPreferencesUseCase>(
      UpdateUserPreferencesUseCase,
    );
  });

  describe('execute', () => {
    const userId = 'user-123';
    const existingPreferences = {
      id: 'pref-123',
      userId,
      locale: 'fr',
      theme: 'dark',
      timezone: 'UTC',
      notifications: {
        server: true,
        ups: true,
        email: false,
        push: true,
      },
      display: {
        defaultUserView: 'table',
        defaultServerView: 'grid',
        defaultUpsView: 'grid',
        defaultRoomView: 'grid',
        defaultGroupView: 'grid',
        compactMode: false,
      },
      integrations: {},
      performance: {
        autoRefresh: true,
        refreshInterval: 60,
      },
    } as UserPreference;

    it('should update existing preferences', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        locale: 'en',
        theme: 'light',
        timezone: 'Europe/Paris',
      };

      const updatedPreferences = {
        ...existingPreferences,
        ...updateDto,
      } as UserPreference;

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockResolvedValue(updatedPreferences);

      const result = await useCase.execute(userId, updateDto);

      expect(result.locale).toBe('en');
      expect(result.theme).toBe('light');
      expect(result.timezone).toBe('Europe/Paris');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should create preferences if they do not exist', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        locale: 'en',
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.userId).toBe(userId);
      expect(result.locale).toBe('en');
      expect(result.theme).toBe('dark'); // default value
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should update nested notification preferences', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        notifications: {
          email: true,
          push: false,
        },
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.notifications).toEqual({
        server: true, // unchanged
        ups: true, // unchanged
        email: true, // updated
        push: false, // updated
      });
    });

    it('should update display preferences', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        display: {
          defaultUserView: 'card',
          compactMode: true,
        },
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.display).toEqual({
        defaultUserView: 'card',
        defaultServerView: 'grid', // unchanged
        defaultUpsView: 'grid', // unchanged
        defaultRoomView: 'grid', // unchanged
        defaultGroupView: 'grid', // unchanged
        compactMode: true,
      });
    });

    it('should update new view preferences', async () => {
      const freshPreferences = {
        ...existingPreferences,
        display: {
          defaultUserView: 'table',
          defaultServerView: 'grid',
          defaultUpsView: 'grid',
          defaultRoomView: 'grid',
          defaultGroupView: 'grid',
          compactMode: false,
        },
      } as UserPreference;

      const updateDto: UpdateUserPreferencesDto = {
        display: {
          defaultUpsView: 'list',
          defaultRoomView: 'list',
          defaultGroupView: 'sections',
        },
      };

      mockRepository.findByUserId.mockResolvedValue(freshPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.display.defaultUpsView).toBe('list');
      expect(result.display.defaultRoomView).toBe('list');
      expect(result.display.defaultGroupView).toBe('sections');
      expect(result.display.defaultUserView).toBe('table'); // unchanged
      expect(result.display.defaultServerView).toBe('grid'); // unchanged
    });

    it('should update integration webhooks', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        integrations: {
          slackWebhook: 'https://hooks.slack.com/services/test',
          alertEmail: 'alerts@example.com',
        },
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.integrations).toEqual({
        slackWebhook: 'https://hooks.slack.com/services/test',
        alertEmail: 'alerts@example.com',
      });
    });

    it('should clear integration values when set to empty string', async () => {
      const prefsWithIntegrations = {
        ...existingPreferences,
        integrations: {
          slackWebhook: 'https://old-webhook.com',
          alertEmail: 'old@example.com',
        },
      };

      const updateDto: UpdateUserPreferencesDto = {
        integrations: {
          slackWebhook: '',
          alertEmail: '',
        },
      };

      mockRepository.findByUserId.mockResolvedValue(prefsWithIntegrations);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.integrations.slackWebhook).toBeUndefined();
      expect(result.integrations.alertEmail).toBeUndefined();
    });

    it('should update performance settings', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        performance: {
          autoRefresh: false,
          refreshInterval: 120,
        },
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.performance).toEqual({
        autoRefresh: false,
        refreshInterval: 120,
      });
    });

    it('should throw error for invalid timezone', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        timezone: 'Invalid/Timezone',
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);

      await expect(useCase.execute(userId, updateDto)).rejects.toThrow(
        UserPreferencesExceptions.invalidTimezone('Invalid/Timezone'),
      );
    });

    it('should throw error if update fails', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        locale: 'en',
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(userId, updateDto)).rejects.toThrow(
        UserPreferencesExceptions.failedToUpdate(),
      );
    });

    it('should handle partial updates without affecting other fields', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        theme: 'light',
      };

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      const result = await useCase.execute(userId, updateDto);

      expect(result.theme).toBe('light');
      expect(result.locale).toBe(existingPreferences.locale); // unchanged
      expect(result.timezone).toBe(existingPreferences.timezone); // unchanged
      expect(result.notifications).toEqual(existingPreferences.notifications); // unchanged
    });
  });
});