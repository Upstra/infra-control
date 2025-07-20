import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemSettingsService } from '../system-settings.service';
import { DefaultSettingsService } from '../default-settings.service';
import { ISystemSettingsRepository } from '../../interfaces/system-settings-repository.interface';
import {
  SystemSettings,
  SystemSettingsData,
} from '../../entities/system-settings.entity';
import { LogHistoryUseCase } from '../../../../history/application/use-cases/log-history.use-case';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;
  let repository: ISystemSettingsRepository;
  let defaultSettingsService: DefaultSettingsService;
  let eventEmitter: EventEmitter2;
  let logHistoryUseCase: LogHistoryUseCase;

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
    const mockRepository = {
      findSettings: jest.fn(),
      createSettings: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SystemSettingsService,
          useFactory: (
            repository: ISystemSettingsRepository,
            defaultSettingsService: DefaultSettingsService,
            eventEmitter: EventEmitter2,
            logHistoryUseCase: LogHistoryUseCase,
          ) => {
            return new SystemSettingsService(
              repository,
              defaultSettingsService,
              eventEmitter,
              logHistoryUseCase,
            );
          },
          inject: [
            'ISystemSettingsRepository',
            DefaultSettingsService,
            EventEmitter2,
            LogHistoryUseCase,
          ],
        },
        {
          provide: 'ISystemSettingsRepository',
          useValue: mockRepository,
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
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
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
    logHistoryUseCase = module.get<LogHistoryUseCase>(LogHistoryUseCase);
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
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalled();
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
      expect(logHistoryUseCase.executeStructured).toHaveBeenCalled();
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

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should deep merge nested objects', () => {
      const target = {
        level1: {
          level2: {
            a: 1,
            b: 2,
          },
          c: 3,
        },
      };
      const source = {
        level1: {
          level2: {
            b: 20,
            d: 30,
          },
          e: 40,
        },
      };
      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({
        level1: {
          level2: {
            a: 1,
            b: 20,
            d: 30,
          },
          c: 3,
          e: 40,
        },
      });
    });

    it('should handle non-object source', () => {
      const target = { a: 1 };
      const source = 'not an object';
      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle non-object target', () => {
      const target = 'not an object';
      const source = { a: 1 };
      const result = (service as any).deepMerge(target, source);

      // deepMerge with non-object target returns { ...target }
      // For a string, this creates an object with indices as keys
      expect(typeof result).toBe('object');
      expect(result[0]).toBe('n');
    });

    it('should add new nested object to target', () => {
      const target = { a: 1 };
      const source = { b: { c: 2 } };
      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: { c: 2 } });
    });

    it('should handle arrays without merging them', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5, 6] };
      const result = (service as any).deepMerge(target, source);

      expect(result).toEqual({ arr: [4, 5, 6] });
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect((service as any).isObject({})).toBe(true);
      expect((service as any).isObject({ a: 1 })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect((service as any).isObject([])).toBe(false);
      expect((service as any).isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for null', () => {
      const result = (service as any).isObject(null);
      expect(result).toBeFalsy();
    });

    it('should return false for primitives', () => {
      const undefinedResult = (service as any).isObject(undefined);
      const numberResult = (service as any).isObject(123);
      const stringResult = (service as any).isObject('string');
      const booleanResult = (service as any).isObject(true);

      expect(undefinedResult).toBeFalsy();
      expect(numberResult).toBe(false);
      expect(stringResult).toBe(false);
      expect(booleanResult).toBe(false);
    });
  });

  describe('updateSettings with optional parameters', () => {
    it('should update settings with IP address and user agent', async () => {
      const updates: Partial<SystemSettingsData> = {
        system: {
          maintenanceMode: true,
          maintenanceMessage: 'Under maintenance',
          maxUploadSize: 10,
          allowedFileTypes: ['jpg', 'png'],
          api: { enabled: true, rateLimit: 100 },
          enableWebSockets: true,
        },
      };
      const userId = 'user123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest.spyOn(repository, 'updateSettings').mockResolvedValue(mockSettings);

      await service.updateSettings(updates, userId, ipAddress, userAgent);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress,
          userAgent,
        }),
      );
    });
  });

  describe('resetCategory with optional parameters', () => {
    it('should reset category with IP address and user agent', async () => {
      const category = 'email';
      const userId = 'user123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';
      const defaultEmail = {
        enabled: true,
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: true,
          user: 'default@example.com',
        },
        from: {
          name: 'Default',
          address: 'default@example.com',
        },
      };

      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);
      jest
        .spyOn(defaultSettingsService, 'getDefaultCategory')
        .mockReturnValue(defaultEmail);
      jest.spyOn(repository, 'updateSettings').mockResolvedValue(mockSettings);

      await service.resetCategory(
        category as any,
        userId,
        ipAddress,
        userAgent,
      );

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress,
          userAgent,
          action: 'RESET',
          metadata: { resetCategory: category },
        }),
      );
    });
  });

  describe('cache behavior', () => {
    it('should use cache when not expired', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);

      const firstCall = await service.getSettings();
      const secondCall = await service.getSettings();

      expect(firstCall).toBe(secondCall);
      expect(repository.findSettings).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', async () => {
      jest.spyOn(repository, 'findSettings').mockResolvedValue(mockSettings);

      // First call - will cache the result
      await service.getSettings();

      // Clear the mock to reset call count
      (repository.findSettings as jest.Mock).mockClear();

      // Force cache expiry by modifying the cache expiry time
      (service as any).cacheExpiry = new Date(Date.now() - 1000);

      // Second call - should fetch from repository again
      await service.getSettings();

      expect(repository.findSettings).toHaveBeenCalledTimes(1);
    });
  });
});
