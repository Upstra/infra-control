import { Test, TestingModule } from '@nestjs/testing';
import { GetUserPreferencesUseCase } from '../get-user-preferences.use-case';
import { IUserPreferencesRepository } from '../../../domain/interfaces/user-preferences.repository.interface';
import { UserPreference } from '../../../domain/entities/user-preference.entity';

describe('GetUserPreferencesUseCase', () => {
  let useCase: GetUserPreferencesUseCase;
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
        GetUserPreferencesUseCase,
        {
          provide: 'IUserPreferencesRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserPreferencesUseCase>(GetUserPreferencesUseCase);
  });

  describe('execute', () => {
    const userId = 'user-123';

    it('should return existing preferences when found', async () => {
      const existingPreferences = {
        id: 'pref-123',
        userId,
        locale: 'fr',
        theme: 'dark',
        timezone: 'Europe/Paris',
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

      mockRepository.findByUserId.mockResolvedValue(existingPreferences);

      const result = await useCase.execute(userId);

      expect(result).toEqual(existingPreferences);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create default preferences when none exist', async () => {
      const defaultPreferences = UserPreference.createDefault(userId);
      const savedPreferences = { ...defaultPreferences, id: 'pref-123' };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(savedPreferences);

      const result = await useCase.execute(userId);

      expect(result).toEqual(savedPreferences);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          locale: 'fr',
          theme: 'dark',
          timezone: 'UTC',
        }),
      );
    });

    it('should create preferences with correct default values', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockImplementation(async (pref) => ({
        ...pref,
        id: 'pref-123',
      }));

      const result = await useCase.execute(userId);

      expect(result.userId).toBe(userId);
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
  });
});