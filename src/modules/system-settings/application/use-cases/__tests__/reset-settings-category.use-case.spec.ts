import { Test, TestingModule } from '@nestjs/testing';
import { ResetSettingsCategoryUseCase } from '../reset-settings-category.use-case';
import { SystemSettingsService } from '../../../domain/services/system-settings.service';
import { DefaultSettingsService } from '../../../domain/services/default-settings.service';
import { InvalidSettingsCategoryException } from '../../../domain/exceptions/system-settings.exceptions';

describe('ResetSettingsCategoryUseCase', () => {
  let useCase: ResetSettingsCategoryUseCase;
  let systemSettingsService: SystemSettingsService;
  let defaultSettingsService: DefaultSettingsService;

  const mockSettings = {
    id: 'singleton',
    settings: {
      security: {
        registrationEnabled: false,
        requireEmailVerification: true,
        defaultUserRole: 'guest',
        sessionTimeout: 1800,
        maxLoginAttempts: 3,
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
        allowGuestAccess: true,
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
    },
    updatedAt: new Date(),
    updatedById: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetSettingsCategoryUseCase,
        {
          provide: SystemSettingsService,
          useValue: {
            resetCategory: jest.fn(),
          },
        },
        {
          provide: DefaultSettingsService,
          useValue: {
            isValidCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ResetSettingsCategoryUseCase>(
      ResetSettingsCategoryUseCase,
    );
    systemSettingsService = module.get<SystemSettingsService>(
      SystemSettingsService,
    );
    defaultSettingsService = module.get<DefaultSettingsService>(
      DefaultSettingsService,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should reset valid category successfully', async () => {
      const category = 'security';
      const userId = 'user123';

      jest
        .spyOn(defaultSettingsService, 'isValidCategory')
        .mockReturnValue(true);
      jest
        .spyOn(systemSettingsService, 'resetCategory')
        .mockResolvedValue(mockSettings as any);

      const result = await useCase.execute(category, userId);

      expect(result).toEqual(mockSettings.settings);
      expect(defaultSettingsService.isValidCategory).toHaveBeenCalledWith(
        category,
      );
      expect(systemSettingsService.resetCategory).toHaveBeenCalledWith(
        category,
        userId,
        undefined,
        undefined,
      );
    });

    it('should throw error for invalid category', async () => {
      const category = 'invalid';
      const userId = 'user123';

      jest
        .spyOn(defaultSettingsService, 'isValidCategory')
        .mockReturnValue(false);

      await expect(useCase.execute(category, userId)).rejects.toThrow(
        InvalidSettingsCategoryException,
      );
      expect(systemSettingsService.resetCategory).not.toHaveBeenCalled();
    });

    it('should handle all valid categories', async () => {
      const validCategories = [
        'security',
        'system',
        'email',
        'backup',
        'logging',
      ];
      const userId = 'user123';

      jest
        .spyOn(defaultSettingsService, 'isValidCategory')
        .mockReturnValue(true);
      jest
        .spyOn(systemSettingsService, 'resetCategory')
        .mockResolvedValue(mockSettings as any);

      for (const category of validCategories) {
        const result = await useCase.execute(category, userId);
        expect(result).toEqual(mockSettings.settings);
      }

      expect(systemSettingsService.resetCategory).toHaveBeenCalledTimes(
        validCategories.length,
      );
    });
  });
});
