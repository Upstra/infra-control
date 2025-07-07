import { UpdatePreferencesUseCase } from '../update-preferences.use-case';
import { DashboardPreferenceRepository } from '../../../../infrastructure/repositories/dashboard-preference.repository';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutNotFoundException } from '../../../../domain/exceptions/dashboard.exception';
import { UpdateDashboardPreferenceDto } from '../../../dto/dashboard-preference.dto';

describe('UpdatePreferencesUseCase', () => {
  let useCase: UpdatePreferencesUseCase;
  let preferenceRepository: jest.Mocked<DashboardPreferenceRepository>;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;

  beforeEach(() => {
    preferenceRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as any;

    layoutRepository = {
      findByIdAndUserId: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      setDefaultLayout: jest.fn(),
      unsetAllDefaultLayouts: jest.fn(),
    } as any;

    useCase = new UpdatePreferencesUseCase(
      preferenceRepository,
      layoutRepository,
    );
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

    it('should update preferences without defaultLayoutId', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        refreshInterval: 45000,
        theme: 'dark',
        notifications: {
          alerts: false,
          activities: true,
        },
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
        refreshInterval: 45000,
        theme: 'dark' as const,
        notifications: {
          alerts: false,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        defaultLayoutId: null,
        refreshInterval: 45000,
        theme: 'dark',
        notifications: {
          alerts: false,
          activities: true,
        },
      });

      expect(layoutRepository.findByIdAndUserId).not.toHaveBeenCalled();
      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        refreshInterval: 45000,
        theme: 'dark',
        notifications: {
          alerts: false,
          activities: true,
        },
      });
    });

    it('should update preferences with valid defaultLayoutId', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'light',
      };

      const mockLayout = {
        id: 'layout-456',
        name: 'Test Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'light' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findByIdAndUserId.mockResolvedValue(mockLayout as any);
      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });

      expect(layoutRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'layout-456',
        userId,
      );
      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        defaultLayoutId: 'layout-456',
        refreshInterval: 60000,
        theme: 'light',
      });
    });

    it('should throw DashboardLayoutNotFoundException when layout not found', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        defaultLayoutId: 'non-existent-layout',
        theme: 'dark',
      };

      layoutRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNotFoundException,
      );

      expect(layoutRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'non-existent-layout',
        userId,
      );
      expect(preferenceRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw DashboardLayoutNotFoundException when layout belongs to different user', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        defaultLayoutId: 'layout-456',
        theme: 'dark',
      };

      layoutRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNotFoundException,
      );

      expect(layoutRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'layout-456',
        userId,
      );
      expect(preferenceRepository.upsert).not.toHaveBeenCalled();
    });

    it('should update only refreshInterval', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        refreshInterval: 15000,
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'existing-layout',
        refreshInterval: 15000,
        theme: 'light' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        defaultLayoutId: 'existing-layout',
        refreshInterval: 15000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });

      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        refreshInterval: 15000,
      });
    });

    it('should update only theme', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        theme: 'dark',
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
        refreshInterval: 30000,
        theme: 'dark' as const,
        notifications: {
          alerts: true,
          activities: false,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result.theme).toBe('dark');
      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        theme: 'dark',
      });
    });

    it('should update only notifications', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        notifications: {
          alerts: false,
          activities: true,
        },
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
        refreshInterval: 30000,
        theme: 'light' as const,
        notifications: {
          alerts: false,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result.notifications).toEqual({
        alerts: false,
        activities: true,
      });

      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        notifications: {
          alerts: false,
          activities: true,
        },
      });
    });

    it('should update all preferences at once', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        defaultLayoutId: 'layout-789',
        refreshInterval: 90000,
        theme: 'dark',
        notifications: {
          alerts: true,
          activities: true,
        },
      };

      const mockLayout = {
        id: 'layout-789',
        name: 'Full Layout',
        userId,
        columns: 16,
        rowHeight: 100,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: 'layout-789',
        refreshInterval: 90000,
        theme: 'dark' as const,
        notifications: {
          alerts: true,
          activities: true,
        },
        user: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findByIdAndUserId.mockResolvedValue(mockLayout as any);
      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        defaultLayoutId: 'layout-789',
        refreshInterval: 90000,
        theme: 'dark',
        notifications: {
          alerts: true,
          activities: true,
        },
      });

      expect(layoutRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'layout-789',
        userId,
      );
      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        defaultLayoutId: 'layout-789',
        refreshInterval: 90000,
        theme: 'dark',
        notifications: {
          alerts: true,
          activities: true,
        },
      });
    });

    it('should handle repository upsert failure', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        theme: 'dark',
      };

      preferenceRepository.upsert.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        'Database error',
      );

      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
        theme: 'dark',
      });
    });

    it('should handle layout repository failure', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        defaultLayoutId: 'layout-456',
      };

      layoutRepository.findByIdAndUserId.mockRejectedValue(
        new Error('Layout repository error'),
      );

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        'Layout repository error',
      );

      expect(layoutRepository.findByIdAndUserId).toHaveBeenCalledWith(
        'layout-456',
        userId,
      );
      expect(preferenceRepository.upsert).not.toHaveBeenCalled();
    });

    it('should handle partial notifications update', async () => {
      const dto: UpdateDashboardPreferenceDto = {
        notifications: {
          alerts: true,
          activities: false,
        },
      };

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
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

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result.notifications.alerts).toBe(true);
      expect(result.notifications.activities).toBe(false);
    });

    it('should handle empty dto', async () => {
      const dto: UpdateDashboardPreferenceDto = {};

      const updatedPreference = {
        id: 'pref-123',
        userId,
        defaultLayoutId: null,
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

      preferenceRepository.upsert.mockResolvedValue(updatedPreference);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        defaultLayoutId: null,
        refreshInterval: 30000,
        theme: 'light',
        notifications: {
          alerts: true,
          activities: false,
        },
      });

      expect(preferenceRepository.upsert).toHaveBeenCalledWith({
        userId,
      });
    });
  });
});
