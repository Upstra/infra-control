import { Test, TestingModule } from '@nestjs/testing';
import { GetSystemSettingsUseCase } from '../get-system-settings.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { SystemSettings } from '../../../domain/entities/system-settings.entity';

describe('GetSystemSettingsUseCase', () => {
  let useCase: GetSystemSettingsUseCase;
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
        GetSystemSettingsUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            getSettings: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetSystemSettingsUseCase>(GetSystemSettingsUseCase);
    systemSettingsService = module.get<SystemSettingsService>(
      SystemSettingsService,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return system settings data', async () => {
      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings);

      const result = await useCase.execute();

      expect(result).toEqual(mockSettings.settings);
      expect(systemSettingsService.getSettings).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(systemSettingsService, 'getSettings').mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
    });
  });
});
