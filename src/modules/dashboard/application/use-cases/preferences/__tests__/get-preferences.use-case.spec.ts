import { GetPreferencesUseCase } from '../get-preferences.use-case';
import { DashboardPreferenceRepository } from '../../../../infrastructure/repositories/dashboard-preference.repository';

describe('GetPreferencesUseCase', () => {
  let useCase: GetPreferencesUseCase;
  let preferenceRepository: jest.Mocked<DashboardPreferenceRepository>;

  beforeEach(() => {
    preferenceRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new GetPreferencesUseCase(preferenceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'user-123';
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return existing preferences when found', async () => {
      const existingPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'dark' as const,
        notifications: {
          alerts: false,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.findByUserId.mockResolvedValue(existingPreference);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'dark',
        notifications: {
          alerts: false,
          activities: true,
        },
      });

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(preferenceRepository.create).not.toHaveBeenCalled();
    });

    it('should create and return default preferences when not found', async () => {
      preferenceRepository.findByUserId.mockResolvedValue(null);

      const newPreference = {
        id: 'pref-new',
        userId,
        defaultLayoutId: undefined,
        refreshInterval: 30000,
        theme: 'light' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.create.mockResolvedValue(newPreference);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        defaultLayoutId: undefined,
        refreshInterval: 30000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(preferenceRepository.create).toHaveBeenCalledWith({
        userId,
        refreshInterval: 30000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });
    });

    it('should handle preference with null defaultLayoutId', async () => {
      const existingPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
        refreshInterval: 45000,
        theme: 'light' as const,
        notifications: {
          alerts: true,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.findByUserId.mockResolvedValue(existingPreference);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        defaultLayoutId: null,
        refreshInterval: 45000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: true,
        },
      });

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(preferenceRepository.create).not.toHaveBeenCalled();
    });

    it('should handle preference creation failure', async () => {
      preferenceRepository.findByUserId.mockResolvedValue(null);
      preferenceRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(useCase.execute(userId)).rejects.toThrow('Database error');

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(preferenceRepository.create).toHaveBeenCalledWith({
        userId,
        refreshInterval: 30000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });
    });

    it('should handle repository findByUserId failure', async () => {
      preferenceRepository.findByUserId.mockRejectedValue(
        new Error('Repository error'),
      );

      await expect(useCase.execute(userId)).rejects.toThrow('Repository error');

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(preferenceRepository.create).not.toHaveBeenCalled();
    });

    it('should return preferences with all notification options', async () => {
      const existingPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-789',
        refreshInterval: 15000,
        theme: 'dark' as const,
        notifications: {
          alerts: true,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.findByUserId.mockResolvedValue(existingPreference);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        defaultLayoutId: 'layout-789',
        refreshInterval: 15000,
        theme: 'dark',
        notifications: {
          alerts: true,
          activities: true,
        },
      });

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle minimum refresh interval', async () => {
      const existingPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-min',
        refreshInterval: 5000,
        theme: 'light' as const,
        notifications: {
          alerts: false,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.findByUserId.mockResolvedValue(existingPreference);

      const result = await useCase.execute(userId);

      expect(result.refreshInterval).toBe(5000);
      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle maximum refresh interval', async () => {
      const existingPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-max',
        refreshInterval: 300000,
        theme: 'dark' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.findByUserId.mockResolvedValue(existingPreference);

      const result = await useCase.execute(userId);

      expect(result.refreshInterval).toBe(300000);
      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
