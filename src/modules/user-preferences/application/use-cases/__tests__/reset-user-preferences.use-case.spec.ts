import { Test, TestingModule } from '@nestjs/testing';
import { ResetUserPreferencesUseCase } from '../reset-user-preferences.use-case';
import { IUserPreferencesRepository } from '../../../domain/interfaces/user-preferences.repository.interface';
import { UserPreference } from '../../../domain/entities/user-preference.entity';
import { UserPreferencesExceptions } from '../../../domain/exceptions/user-preferences.exception';

describe('ResetUserPreferencesUseCase', () => {
  let useCase: ResetUserPreferencesUseCase;
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
        ResetUserPreferencesUseCase,
        {
          provide: 'IUserPreferencesRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ResetUserPreferencesUseCase>(
      ResetUserPreferencesUseCase,
    );
  });

  describe('execute', () => {
    const userId = 'user-123';

    it('should reset existing preferences to default values', async () => {
      const existingPreferences = {
        id: 'pref-123',
        userId,
        locale: 'en',
        theme: 'light',
        timezone: 'Europe/Paris',
        notifications: {
          server: false,
          ups: false,
          email: true,
          push: false,
        },
        display: {
          defaultUserView: 'card',
          defaultServerView: 'list',
          defaultUpsView: 'list',
          defaultRoomView: 'list',
          defaultGroupView: 'flow',
          compactMode: true,
        },
        integrations: {
          slackWebhook: 'https://hooks.slack.com/services/test',
          alertEmail: 'alerts@example.com',
        },
        performance: {
          autoRefresh: false,
          refreshInterval: 300,
        },
      } as UserPreference;

      const resetPreferences = {
        ...existingPreferences,
        locale: 'fr' as const,
        theme: 'dark' as const,
        timezone: 'UTC',
        notifications: {
          server: true,
          ups: true,
          email: false,
          push: true,
        },
        display: {
          defaultUserView: 'table' as const,
          defaultServerView: 'grid' as const,
          defaultUpsView: 'grid' as const,
          defaultRoomView: 'grid' as const,
          defaultGroupView: 'grid' as const,
          compactMode: false,
        },
        integrations: {},
        performance: {
          autoRefresh: true,
          refreshInterval: 60,
        },
      } as UserPreference;

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockResolvedValue(resetPreferences);

      const result = await useCase.execute(userId);

      expect(result).toEqual(resetPreferences);
      expect(result.locale).toBe('fr');
      expect(result.theme).toBe('dark');
      expect(result.timezone).toBe('UTC');
      expect(result.notifications).toEqual({
        server: true,
        ups: true,
        email: false,
        push: true,
      });
      expect(result.display).toEqual({
        defaultUserView: 'table',
        defaultServerView: 'grid',
        defaultUpsView: 'grid',
        defaultRoomView: 'grid',
        defaultGroupView: 'grid',
        compactMode: false,
      });
      expect(result.integrations).toEqual({});
      expect(result.performance).toEqual({
        autoRefresh: true,
        refreshInterval: 60,
      });
    });

    it('should create default preferences if none exist', async () => {
      const defaultPreferences = UserPreference.createDefault(userId);
      const savedPreferences = { ...defaultPreferences, id: 'pref-123' };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(savedPreferences);

      const result = await useCase.execute(userId);

      expect(result).toEqual(savedPreferences);
      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          locale: 'fr',
          theme: 'dark',
          timezone: 'UTC',
        }),
      );
    });

    it('should preserve the preferences ID when resetting', async () => {
      const existingPreferences = {
        id: 'pref-123',
        userId,
        locale: 'en',
        theme: 'light',
      } as UserPreference;

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockImplementation(async (pref) => pref);

      await useCase.execute(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pref-123', // ID should be preserved
          userId,
        }),
      );
    });

    it('should throw error if reset fails', async () => {
      const existingPreferences = {
        id: 'pref-123',
        userId,
      } as UserPreference;

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);
      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(userId)).rejects.toThrow(
        UserPreferencesExceptions.failedToReset(),
      );
    });

    it('should handle reset for user with no previous preferences', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.update.mockImplementation(async (pref) => ({
        ...pref,
        id: 'new-pref-123',
      }));

      const result = await useCase.execute(userId);

      expect(result.id).toBe('new-pref-123');
      expect(result.userId).toBe(userId);
      expect(result.locale).toBe('fr');
      expect(result.theme).toBe('dark');
    });
  });
});
