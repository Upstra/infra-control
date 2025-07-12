import { Test, TestingModule } from '@nestjs/testing';
import { ExportSettingsUseCase } from '../export-settings.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { SystemSettings } from '../../../domain/entities/system-settings.entity';

describe('ExportSettingsUseCase', () => {
  let useCase: ExportSettingsUseCase;
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
        ExportSettingsUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            getSettings: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExportSettingsUseCase>(ExportSettingsUseCase);
    systemSettingsService = module.get<SystemSettingsService>(
      SystemSettingsService,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should export settings successfully', async () => {
      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings);

      const result = await useCase.execute();

      expect(result).toHaveProperty('version', '1.0');
      expect(result).toHaveProperty('exportedAt');
      expect(typeof result.exportedAt).toBe('string');
      expect(result).toHaveProperty('settings', mockSettings.settings);
      expect(systemSettingsService.getSettings).toHaveBeenCalled();
    });

    it('should include current timestamp in export', async () => {
      jest
        .spyOn(systemSettingsService, 'getSettings')
        .mockResolvedValue(mockSettings);
      const beforeExport = new Date();

      const result = await useCase.execute();

      const afterExport = new Date();
      const exportedDate = new Date(result.exportedAt);
      expect(exportedDate.getTime()).toBeGreaterThanOrEqual(
        beforeExport.getTime(),
      );
      expect(exportedDate.getTime()).toBeLessThanOrEqual(afterExport.getTime());
    });

    it('should handle service errors', async () => {
      const error = new Error('Export failed');
      jest.spyOn(systemSettingsService, 'getSettings').mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
    });
  });
});
