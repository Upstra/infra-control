import { Test, TestingModule } from '@nestjs/testing';
import { DefaultSettingsService } from '../default-settings.service';

describe('DefaultSettingsService', () => {
  let service: DefaultSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultSettingsService],
    }).compile();

    service = module.get<DefaultSettingsService>(DefaultSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefaultSettings', () => {
    it('should return default settings with all required categories', () => {
      const settings = service.getDefaultSettings();

      expect(settings).toHaveProperty('security');
      expect(settings).toHaveProperty('system');
      expect(settings).toHaveProperty('email');
      expect(settings).toHaveProperty('backup');
      expect(settings).toHaveProperty('logging');
    });

    it('should return correct default security settings', () => {
      const settings = service.getDefaultSettings();
      const security = settings.security;

      expect(security.registrationEnabled).toBe(true);
      expect(security.requireEmailVerification).toBe(false);
      expect(security.defaultUserRole).toBe('user');
      expect(security.sessionTimeout).toBe(3600);
      expect(security.maxLoginAttempts).toBe(5);
      expect(security.allowGuestAccess).toBe(false);
      expect(security.passwordPolicy).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      });
    });

    it('should return correct default system settings', () => {
      const settings = service.getDefaultSettings();
      const system = settings.system;

      expect(system.maintenanceMode).toBe(false);
      expect(system.maintenanceMessage).toBe('');
      expect(system.maxUploadSize).toBe(10);
      expect(system.allowedFileTypes).toEqual(['jpg', 'png', 'pdf', 'docx']);
      expect(system.api.enabled).toBe(true);
      expect(system.api.rateLimit).toBe(100);
      expect(system.enableWebSockets).toBe(true);
    });

    it('should return correct default email settings', () => {
      const settings = service.getDefaultSettings();
      const email = settings.email;

      expect(email.enabled).toBe(false);
      expect(email.smtp.host).toBe('');
      expect(email.smtp.port).toBe(587);
      expect(email.smtp.secure).toBe(true);
      expect(email.smtp.user).toBe('');
      expect(email.from.name).toBe('Upstra');
      expect(email.from.address).toBe('noreply@upstra.io');
    });

    it('should return correct default backup settings', () => {
      const settings = service.getDefaultSettings();
      const backup = settings.backup;

      expect(backup.enabled).toBe(false);
      expect(backup.schedule.interval).toBe(24);
      expect(backup.schedule.retention).toBe(30);
      expect(backup.storage.type).toBe('local');
    });

    it('should return correct default logging settings', () => {
      const settings = service.getDefaultSettings();
      const logging = settings.logging;

      expect(logging.level).toBe('info');
      expect(logging.retention).toBe(7);
      expect(logging.metrics.enabled).toBe(true);
      expect(logging.metrics.retention).toBe(30);
    });
  });

  describe('getDefaultCategory', () => {
    it('should return correct default for security category', () => {
      const category = service.getDefaultCategory('security');
      expect(category).toEqual(service.getDefaultSettings().security);
    });

    it('should return correct default for system category', () => {
      const category = service.getDefaultCategory('system');
      expect(category).toEqual(service.getDefaultSettings().system);
    });

    it('should return correct default for email category', () => {
      const category = service.getDefaultCategory('email');
      expect(category).toEqual(service.getDefaultSettings().email);
    });

    it('should return correct default for backup category', () => {
      const category = service.getDefaultCategory('backup');
      expect(category).toEqual(service.getDefaultSettings().backup);
    });

    it('should return correct default for logging category', () => {
      const category = service.getDefaultCategory('logging');
      expect(category).toEqual(service.getDefaultSettings().logging);
    });
  });

  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(service.isValidCategory('security')).toBe(true);
      expect(service.isValidCategory('system')).toBe(true);
      expect(service.isValidCategory('email')).toBe(true);
      expect(service.isValidCategory('backup')).toBe(true);
      expect(service.isValidCategory('logging')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(service.isValidCategory('invalid')).toBe(false);
      expect(service.isValidCategory('')).toBe(false);
      expect(service.isValidCategory('Security')).toBe(false);
      expect(service.isValidCategory('SYSTEM')).toBe(false);
    });
  });
});
