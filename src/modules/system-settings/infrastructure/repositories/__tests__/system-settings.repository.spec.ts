import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingsRepository } from '../system-settings.repository';
import { SystemSettings } from '../../../domain/entities/system-settings.entity';

describe('SystemSettingsRepository', () => {
  let repository: SystemSettingsRepository;
  let typeOrmRepository: Repository<SystemSettings>;

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
        SystemSettingsRepository,
        {
          provide: getRepositoryToken(SystemSettings),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<SystemSettingsRepository>(SystemSettingsRepository);
    typeOrmRepository = module.get<Repository<SystemSettings>>(
      getRepositoryToken(SystemSettings),
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findSettings', () => {
    it('should find settings with singleton id', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockSettings);

      const result = await repository.findSettings();

      expect(result).toEqual(mockSettings);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'singleton' },
        relations: ['updatedBy'],
      });
    });

    it('should return null if settings not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findSettings();

      expect(result).toBeNull();
    });
  });

  describe('createSettings', () => {
    it('should create new settings', async () => {
      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(mockSettings);

      const result = await repository.createSettings(mockSettings);

      expect(result).toEqual(mockSettings);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
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

      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(updatedSettings);

      const result = await repository.updateSettings(updatedSettings);

      expect(result).toEqual(updatedSettings);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(updatedSettings);
    });
  });
});
