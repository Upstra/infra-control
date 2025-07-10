import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSystemSettingsUseCase } from '../update-system-settings.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { SystemSettings } from '../../../domain/entities/system-settings.entity';

describe('UpdateSystemSettingsUseCase', () => {
  let useCase: UpdateSystemSettingsUseCase;
  let systemSettingsService: SystemSettingsService;

  const mockSettings: SystemSettings = {
    id: 'singleton',
    settings: {
      security: {
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultUserRole: 'user',
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
        allowGuestAccess: false,
      },
      system: {
        maintenanceMode: false,
        maintenanceMessage: '',
        maxUploadSize: 10,
        allowedFileTypes: ['jpg', 'png', 'pdf', 'docx'],
        api: {
          enabled: true,
          rateLimit: 100,
        },
        enableWebSockets: true,
      },
      email: {
        enabled: false,
        smtp: {
          host: '',
          port: 587,
          secure: true,
          user: '',
        },
        from: {
          name: 'Upstra',
          address: 'noreply@upstra.io',
        },
      },
      backup: {
        enabled: false,
        schedule: {
          interval: 24,
          retention: 30,
        },
        storage: {
          type: 'local',
        },
      },
      logging: {
        level: 'info',
        retention: 7,
        metrics: {
          enabled: true,
          retention: 30,
        },
      },
    },
    updatedAt: new Date(),
    updatedById: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSystemSettingsUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            updateSettings: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateSystemSettingsUseCase>(UpdateSystemSettingsUseCase);
    systemSettingsService = module.get<SystemSettingsService>(SystemSettingsService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update settings successfully', async () => {
      const updates = { system: { maintenanceMode: true } };
      const userId = 'user123';
      const updatedSettings = {
        ...mockSettings,
        settings: {
          ...mockSettings.settings,
          system: {
            ...mockSettings.settings.system,
            maintenanceMode: true,
          },
        },
      };

      jest.spyOn(systemSettingsService, 'updateSettings').mockResolvedValue(updatedSettings);

      const result = await useCase.execute(updates, userId);

      expect(result).toEqual(updatedSettings.settings);
      expect(systemSettingsService.updateSettings).toHaveBeenCalledWith(updates, userId, undefined, undefined);
    });

    it('should handle partial updates', async () => {
      const updates = {
        security: {
          passwordPolicy: {
            minLength: 12,
          },
        },
      };
      const userId = 'user123';

      jest.spyOn(systemSettingsService, 'updateSettings').mockResolvedValue(mockSettings);

      const result = await useCase.execute(updates, userId);

      expect(result).toEqual(mockSettings.settings);
      expect(systemSettingsService.updateSettings).toHaveBeenCalledWith(updates, userId, undefined, undefined);
    });

    it('should handle service errors', async () => {
      const error = new Error('Update failed');
      jest.spyOn(systemSettingsService, 'updateSettings').mockRejectedValue(error);

      await expect(useCase.execute({}, 'user123')).rejects.toThrow(error);
    });
  });
});