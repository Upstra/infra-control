import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemSettingsService } from '../system-settings.service';
import { DefaultSettingsService } from '../default-settings.service';
import { ISystemSettingsRepository } from '../../interfaces/system-settings-repository.interface';
import {
  SystemSettings,
  SystemSettingsData,
} from '../../entities/system-settings.entity';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let repository: ISystemSettingsRepository;
  let defaultSettingsService: DefaultSettingsService;
  let eventEmitter: EventEmitter2;

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
        SystemSettingsService,
        {
          provide: 'ISystemSettingsRepository',
          useValue: {
            findSettings: jest.fn(),
            createSettings: jest.fn(),
            updateSettings: jest.fn(),
          },
        },
        {
          provide: DefaultSettingsService,
          useValue: {
            getDefaultSettings: jest
              .fn()
              .mockReturnValue(mockSettings.settings),
            getDefaultCategory: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SystemSettingsService>(SystemSettingsService);
    repository = module.get<ISystemSettingsRepository>(
      'ISystemSettingsRepository',
    );
    defaultSettingsService = module.get<DefaultSettingsService>(
      DefaultSettingsService,
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Add missing LogHistoryUseCase dependency
    (service as any).logHistoryUseCase = {
      executeStructured: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return cached settings if available', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);

      await service.getSettings();
      const result = await service.getSettings();

      expect(result).toEqual(mockSettings);
      expect(repository.findSettings).toHaveBeenCalledTimes(1);
    });

    it('should create default settings if none exist', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(null);
      jest.spyOn(repository, 'createSettings').mockResolvedValue(mockSettings);

      const result = await service.getSettings();

      expect(result).toEqual(mockSettings);
      expect(repository.createSettings).toHaveBeenCalled();
      expect(defaultSettingsService.getDefaultSettings).toHaveBeenCalled();
    });

    it('should refresh cache when expired', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);

      await service.getSettings();
      service.invalidateCache();
      await service.getSettings();

      expect(repository.findSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const updates: Partial<SystemSettingsData> = {
        system: {
          maintenanceMode: true,
          maintenanceMessage: '',
          maxUploadSize: 10,
          allowedFileTypes: ['jpg', 'png', 'pdf', 'docx'],
          api: {
            enabled: true,
            rateLimit: 100,
          },
          enableWebSockets: true,
        },
      };
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

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest
        .spyOn(repository, 'updateSettings')
        .mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(updates, userId);

      expect(result).toEqual(updatedSettings);
      expect(repository.updateSettings).toHaveBeenCalled();
      expect(
        (service as any).logHistoryUseCase.executeStructured,
      ).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'system-settings.updated',
        {
          settings: updatedSettings,
          changes: updates,
          userId,
        },
      );
    });

    it('should deep merge settings updates', async () => {
      const updates: Partial<SystemSettingsData> = {
        security: {
          registrationEnabled: true,
          requireEmailVerification: false,
          defaultUserRole: 'user',
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
          },
          allowGuestAccess: false,
        },
      };
      const userId = 'user123';

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest
        .spyOn(repository, 'updateSettings')
        .mockImplementation(async (settings) => settings);

      await service.updateSettings(updates, userId);

      const savedSettings = (repository.updateSettings as jest.Mock).mock
        .calls[0][0];
      expect(savedSettings.settings.security.passwordPolicy.minLength).toBe(12);
      expect(
        savedSettings.settings.security.passwordPolicy.requireUppercase,
      ).toBe(true);
    });

    it('should invalidate cache after update', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest.spyOn(repository, 'updateSettings').mockResolvedValue(mockSettings);

      await service.updateSettings({}, 'user123');

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      await service.getSettings();

      expect(repository.findSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetCategory', () => {
    it('should reset category to defaults', async () => {
      const category = 'security';
      const userId = 'user123';
      const defaultSecurity = {
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
      };

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest
        .spyOn(defaultSettingsService, 'getDefaultCategory')
        .mockReturnValue(defaultSecurity);
      jest
        .spyOn(repository, 'updateSettings')
        .mockImplementation(async (settings) => settings);

      await service.resetCategory(category as any, userId);

      const savedSettings = (repository.updateSettings as jest.Mock).mock
        .calls[0][0];
      expect(savedSettings.settings.security).toEqual(defaultSecurity);
      expect(
        (service as any).logHistoryUseCase.executeStructured,
      ).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'system-settings.category-reset',
        {
          category,
          userId,
        },
      );
    });

    it('should invalidate cache after reset', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest.spyOn(repository, 'updateSettings').mockResolvedValue(mockSettings);
      jest
        .spyOn(defaultSettingsService, 'getDefaultCategory')
        .mockReturnValue({});

      await service.resetCategory('security', 'user123');

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      await service.getSettings();

      expect(repository.findSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateCache', () => {
    it('should clear cache', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);

      await service.getSettings();
      service.invalidateCache();

      await service.getSettings();

      expect(repository.findSettings).toHaveBeenCalledTimes(2);
    });
  });
});
