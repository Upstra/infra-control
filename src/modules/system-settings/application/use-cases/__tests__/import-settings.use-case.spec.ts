import { Test, TestingModule } from '@nestjs/testing';
import { ImportSettingsUseCase, ImportSettingsData } from '../import-settings.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { SettingsImportException } from '../../../domain/exceptions/system-settings.exceptions';
import { SystemSettings } from '../../../domain/entities/system-settings.entity';

describe('ImportSettingsUseCase', () => {
  let useCase: ImportSettingsUseCase;
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

  const validImportData: ImportSettingsData = {
    version: '1.0',
    exportedAt: new Date(),
    settings: mockSettings.settings,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportSettingsUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            updateSettings: jest.fn(),
          },
        },
        {
          provide: 'LogHistoryUseCase',
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ImportSettingsUseCase>(ImportSettingsUseCase);
    systemSettingsService = module.get<SystemSettingsService>(SystemSettingsService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should import settings successfully', async () => {
      const userId = 'user123';

      jest.spyOn(systemSettingsService, 'updateSettings').mockResolvedValue(mockSettings);

      const result = await useCase.execute(validImportData, userId);

      expect(result).toEqual(mockSettings.settings);
      expect(systemSettingsService.updateSettings).toHaveBeenCalledWith(
        validImportData.settings,
        userId,
        undefined,
        undefined,
      );
    });

    it('should throw error if version is missing', async () => {
      const invalidData = {
        exportedAt: new Date(),
        settings: mockSettings.settings,
      } as ImportSettingsData;

      await expect(useCase.execute(invalidData, 'user123')).rejects.toThrow(
        new SettingsImportException('Invalid import data format'),
      );
    });

    it('should throw error if settings are missing', async () => {
      const invalidData = {
        version: '1.0',
        exportedAt: new Date(),
      } as ImportSettingsData;

      await expect(useCase.execute(invalidData, 'user123')).rejects.toThrow(
        new SettingsImportException('Invalid import data format'),
      );
    });

    it('should throw error for unsupported version', async () => {
      const invalidData = {
        ...validImportData,
        version: '2.0',
      };

      await expect(useCase.execute(invalidData, 'user123')).rejects.toThrow(
        new SettingsImportException('Unsupported settings version: 2.0'),
      );
    });

    it('should throw error if required category is missing', async () => {
      const invalidSettings = {
        ...validImportData,
        settings: {
          security: mockSettings.settings.security,
          system: mockSettings.settings.system,
          email: mockSettings.settings.email,
          backup: mockSettings.settings.backup,
          // logging is missing
        },
      };

      await expect(useCase.execute(invalidSettings, 'user123')).rejects.toThrow(
        new SettingsImportException('Invalid settings structure: Missing required category: logging'),
      );
    });

    it('should throw error if passwordPolicy is invalid', async () => {
      const invalidSettings = {
        ...validImportData,
        settings: {
          ...mockSettings.settings,
          security: {
            ...mockSettings.settings.security,
            passwordPolicy: 'invalid',
          },
        },
      };

      await expect(useCase.execute(invalidSettings, 'user123')).rejects.toThrow(
        new SettingsImportException('Invalid settings structure: Invalid security.passwordPolicy structure'),
      );
    });

    it('should throw error if smtp is invalid', async () => {
      const invalidSettings = {
        ...validImportData,
        settings: {
          ...mockSettings.settings,
          email: {
            ...mockSettings.settings.email,
            smtp: 'invalid',
          },
        },
      };

      await expect(useCase.execute(invalidSettings, 'user123')).rejects.toThrow(
        new SettingsImportException('Invalid settings structure: Invalid email.smtp structure'),
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Update failed');
      jest.spyOn(systemSettingsService, 'updateSettings').mockRejectedValue(error);

      await expect(useCase.execute(validImportData, 'user123')).rejects.toThrow(error);
    });
  });
});