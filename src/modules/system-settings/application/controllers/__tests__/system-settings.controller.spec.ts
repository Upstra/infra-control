import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingsController } from '../system-settings.controller';
import { GetSystemSettingsUseCase } from '../../use-cases/get-system-settings.use-case';
import { UpdateSystemSettingsUseCase } from '../../use-cases/update-system-settings.use-case';
import { ResetSettingsCategoryUseCase } from '../../use-cases/reset-settings-category.use-case';
import { TestEmailConfigurationUseCase } from '../../use-cases/test-email-configuration.use-case';
import { ExportSettingsUseCase } from '../../use-cases/export-settings.use-case';
import { ImportSettingsUseCase } from '../../use-cases/import-settings.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { UpdateSystemSettingsDto } from '../../dto/update-system-settings.dto';
import { TestEmailDto } from '../../dto/test-email.dto';
import { ImportSettingsDto } from '../../dto/import-settings.dto';

describe('SystemSettingsController', () => {
  let controller: SystemSettingsController;
  let getSystemSettingsUseCase: GetSystemSettingsUseCase;
  let updateSystemSettingsUseCase: UpdateSystemSettingsUseCase;
  let resetSettingsCategoryUseCase: ResetSettingsCategoryUseCase;
  let testEmailConfigurationUseCase: TestEmailConfigurationUseCase;
  let exportSettingsUseCase: ExportSettingsUseCase;
  let importSettingsUseCase: ImportSettingsUseCase;

  const mockUser: JwtPayload = {
    userId: 'user123',
    email: 'test@example.com',
  };

  const mockSettings = {
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
        type: 'local' as const,
      },
    },
    logging: {
      level: 'info' as const,
      retention: 7,
      metrics: {
        enabled: true,
        retention: 30,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemSettingsController],
      providers: [
        {
          provide: GetSystemSettingsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateSystemSettingsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ResetSettingsCategoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: TestEmailConfigurationUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExportSettingsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ImportSettingsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SystemSettingsController>(SystemSettingsController);
    getSystemSettingsUseCase = module.get<GetSystemSettingsUseCase>(GetSystemSettingsUseCase);
    updateSystemSettingsUseCase = module.get<UpdateSystemSettingsUseCase>(UpdateSystemSettingsUseCase);
    resetSettingsCategoryUseCase = module.get<ResetSettingsCategoryUseCase>(ResetSettingsCategoryUseCase);
    testEmailConfigurationUseCase = module.get<TestEmailConfigurationUseCase>(TestEmailConfigurationUseCase);
    exportSettingsUseCase = module.get<ExportSettingsUseCase>(ExportSettingsUseCase);
    importSettingsUseCase = module.get<ImportSettingsUseCase>(ImportSettingsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return system settings', async () => {
      jest.spyOn(getSystemSettingsUseCase, 'execute').mockResolvedValue(mockSettings);

      const result = await controller.getSettings();

      expect(result).toEqual(mockSettings);
      expect(getSystemSettingsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update system settings', async () => {
      const updateDto: UpdateSystemSettingsDto = {
        system: {
          maintenanceMode: true,
        },
      };

      jest.spyOn(updateSystemSettingsUseCase, 'execute').mockResolvedValue(mockSettings);

      const result = await controller.updateSettings(updateDto, mockUser);

      expect(result).toEqual(mockSettings);
      expect(updateSystemSettingsUseCase.execute).toHaveBeenCalledWith(updateDto, mockUser.userId);
    });
  });

  describe('resetCategory', () => {
    it('should reset settings category', async () => {
      const category = 'security';

      jest.spyOn(resetSettingsCategoryUseCase, 'execute').mockResolvedValue(mockSettings);

      const result = await controller.resetCategory(category, mockUser);

      expect(result).toEqual(mockSettings);
      expect(resetSettingsCategoryUseCase.execute).toHaveBeenCalledWith(category, mockUser.userId);
    });
  });

  describe('testEmail', () => {
    it('should test email configuration', async () => {
      const testEmailDto: TestEmailDto = {
        to: 'test@example.com',
      };

      jest.spyOn(testEmailConfigurationUseCase, 'execute').mockResolvedValue(undefined);

      await controller.testEmail(testEmailDto);

      expect(testEmailConfigurationUseCase.execute).toHaveBeenCalledWith(testEmailDto.to);
    });
  });

  describe('exportSettings', () => {
    it('should export settings', async () => {
      const exportedData = {
        version: '1.0',
        exportedAt: new Date(),
        settings: mockSettings,
      };

      jest.spyOn(exportSettingsUseCase, 'execute').mockResolvedValue(exportedData);

      const result = await controller.exportSettings();

      expect(result).toEqual(exportedData);
      expect(exportSettingsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('importSettings', () => {
    it('should import settings', async () => {
      const importDto: ImportSettingsDto = {
        version: '1.0',
        exportedAt: new Date(),
        settings: mockSettings as UpdateSystemSettingsDto,
      };

      jest.spyOn(importSettingsUseCase, 'execute').mockResolvedValue(mockSettings);

      const result = await controller.importSettings(importDto, mockUser);

      expect(result).toEqual(mockSettings);
      expect(importSettingsUseCase.execute).toHaveBeenCalledWith(importDto, mockUser.userId);
    });
  });
});