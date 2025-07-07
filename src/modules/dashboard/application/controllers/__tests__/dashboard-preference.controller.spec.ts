import { Test, TestingModule } from '@nestjs/testing';
import { DashboardPreferenceController } from '../dashboard-preference.controller';
import {
  GetPreferencesUseCase,
  UpdatePreferencesUseCase,
} from '../../use-cases/preferences';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  DashboardPreferenceResponseDto,
  UpdateDashboardPreferenceDto,
} from '../../dto/dashboard-preference.dto';

describe('DashboardPreferenceController', () => {
  let controller: DashboardPreferenceController;
  let getPreferencesUseCase: jest.Mocked<GetPreferencesUseCase>;
  let updatePreferencesUseCase: jest.Mocked<UpdatePreferencesUseCase>;

  const mockUser: JwtPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  const mockPreferences: DashboardPreferenceResponseDto = {
    id: 'pref-1',
    userId: 'test-user-id',
    theme: 'dark',
    refreshInterval: 30,
    defaultLayoutId: 'layout-1',
    defaultDateRange: '7d',
    timezone: 'UTC',
    notifications: {
      alerts: true,
      updates: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardPreferenceController],
      providers: [
        {
          provide: GetPreferencesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdatePreferencesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardPreferenceController>(DashboardPreferenceController);
    getPreferencesUseCase = module.get(GetPreferencesUseCase);
    updatePreferencesUseCase = module.get(UpdatePreferencesUseCase);
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      getPreferencesUseCase.execute.mockResolvedValue(mockPreferences);

      const result = await controller.getPreferences(mockUser);

      expect(result).toEqual(mockPreferences);
      expect(getPreferencesUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should handle when preferences do not exist', async () => {
      const defaultPreferences: DashboardPreferenceResponseDto = {
        id: 'new-pref',
        userId: mockUser.userId,
        theme: 'light',
        refreshInterval: 60,
        defaultLayoutId: null,
        defaultDateRange: '24h',
        timezone: 'UTC',
        notifications: {
          alerts: true,
          updates: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      getPreferencesUseCase.execute.mockResolvedValue(defaultPreferences);

      const result = await controller.getPreferences(mockUser);

      expect(result).toEqual(defaultPreferences);
      expect(getPreferencesUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Database error');
      getPreferencesUseCase.execute.mockRejectedValue(error);

      await expect(controller.getPreferences(mockUser)).rejects.toThrow(error);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updateDto: UpdateDashboardPreferenceDto = {
        theme: 'light',
        refreshInterval: 60,
        defaultLayoutId: 'layout-2',
        defaultDateRange: '30d',
        timezone: 'Europe/Paris',
        notifications: {
          alerts: false,
          updates: true,
        },
      };

      const updatedPreferences = { ...mockPreferences, ...updateDto };
      updatePreferencesUseCase.execute.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockUser, updateDto);

      expect(result).toEqual(updatedPreferences);
      expect(updatePreferencesUseCase.execute).toHaveBeenCalledWith(mockUser.userId, updateDto);
    });

    it('should handle partial updates', async () => {
      const partialUpdateDto: UpdateDashboardPreferenceDto = {
        theme: 'light',
      };

      const updatedPreferences = { ...mockPreferences, theme: 'light' };
      updatePreferencesUseCase.execute.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(mockUser, partialUpdateDto);

      expect(result).toEqual(updatedPreferences);
      expect(updatePreferencesUseCase.execute).toHaveBeenCalledWith(mockUser.userId, partialUpdateDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto: UpdateDashboardPreferenceDto = {
        refreshInterval: -1, // Invalid value
      };

      const error = new Error('Validation failed: refreshInterval must be positive');
      updatePreferencesUseCase.execute.mockRejectedValue(error);

      await expect(controller.updatePreferences(mockUser, invalidDto)).rejects.toThrow(error);
    });

    it('should handle database errors during update', async () => {
      const updateDto: UpdateDashboardPreferenceDto = {
        theme: 'dark',
      };

      const error = new Error('Database connection failed');
      updatePreferencesUseCase.execute.mockRejectedValue(error);

      await expect(controller.updatePreferences(mockUser, updateDto)).rejects.toThrow(error);
    });
  });
});