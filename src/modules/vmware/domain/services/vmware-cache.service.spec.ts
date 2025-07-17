import { Test, TestingModule } from '@nestjs/testing';
import { VmwareCacheService } from './vmware-cache.service';
import { Server } from '@modules/servers/domain/entities/server.entity';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { EncryptionService } from '@/core/services/encryption';

describe('VmwareCacheService', () => {
  let service: VmwareCacheService;
  let redis: jest.Mocked<RedisSafeService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmwareCacheService,
        {
          provide: RedisSafeService,
          useValue: {
            safeGet: jest.fn(),
            safeSet: jest.fn(),
            safeDel: jest.fn(),
            safeLPush: jest.fn(),
            safeHGet: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VmwareCacheService>(VmwareCacheService);
    redis = module.get(RedisSafeService);
    encryptionService = module.get(EncryptionService);
  });

  describe('setVcenterConfig', () => {
    it('should encrypt password and save config to Redis', async () => {
      const config = {
        ip: '192.168.1.100',
        user: 'admin',
        password: 'secret',
        port: 443,
      };

      encryptionService.encrypt.mockReturnValue('encrypted_password');

      await service.setVcenterConfig(config);

      expect(encryptionService.encrypt).toHaveBeenCalledWith('secret');
      expect(redis.safeSet).toHaveBeenCalledWith(
        'metrics:vcenter',
        JSON.stringify({
          ip: '192.168.1.100',
          user: 'admin',
          password: 'encrypted_password',
          port: 443,
        }),
      );
    });

    it('should use default port 443 if not provided', async () => {
      const config = {
        ip: '192.168.1.100',
        user: 'admin',
        password: 'secret',
      };

      encryptionService.encrypt.mockReturnValue('encrypted_password');

      await service.setVcenterConfig(config);

      expect(redis.safeSet).toHaveBeenCalledWith(
        'metrics:vcenter',
        expect.stringContaining('"port":443'),
      );
    });
  });

  describe('setElements', () => {
    it('should delete existing elements and add new ones', async () => {
      const elements = [
        { type: 'VM' as const, moid: 'vm-123' },
        { type: 'Server' as const, moid: 'host-456' },
      ];

      await service.setElements(elements);

      expect(redis.safeDel).toHaveBeenCalledWith('metrics:elements');
      expect(redis.safeLPush).toHaveBeenCalledTimes(2);
      expect(redis.safeLPush).toHaveBeenCalledWith(
        'metrics:elements',
        '{"type":"VM","moid":"vm-123"}',
      );
      expect(redis.safeLPush).toHaveBeenCalledWith(
        'metrics:elements',
        '{"type":"Server","moid":"host-456"}',
      );
    });
  });

  describe('isVcenterConfigured', () => {
    it('should return true if vCenter config exists', async () => {
      redis.safeGet.mockResolvedValue('{"ip":"192.168.1.100"}');

      const result = await service.isVcenterConfigured();

      expect(result).toBe(true);
      expect(redis.safeGet).toHaveBeenCalledWith('metrics:vcenter');
    });

    it('should return false if vCenter config does not exist', async () => {
      redis.safeGet.mockResolvedValue(null);

      const result = await service.isVcenterConfigured();

      expect(result).toBe(false);
    });
  });

  describe('getVcenterConfig', () => {
    it('should parse and return vCenter config if exists', async () => {
      const configJson = '{"ip":"192.168.1.100","user":"admin"}';
      redis.safeGet.mockResolvedValue(configJson);

      const result = await service.getVcenterConfig();

      expect(result).toEqual({ ip: '192.168.1.100', user: 'admin' });
    });

    it('should return null if vCenter config does not exist', async () => {
      redis.safeGet.mockResolvedValue(null);

      const result = await service.getVcenterConfig();

      expect(result).toBeNull();
    });
  });

  describe('initializeIfNeeded', () => {
    it('should not initialize if already configured', async () => {
      redis.safeGet.mockResolvedValue('{"ip":"192.168.1.100"}');

      const servers: Server[] = [];
      await service.initializeIfNeeded(servers);

      expect(redis.safeSet).not.toHaveBeenCalled();
    });

    it('should initialize with first server config if not configured', async () => {
      redis.safeGet.mockResolvedValue(null);
      encryptionService.encrypt.mockReturnValue('encrypted_password');

      const servers = [
        {
          id: '1',
          vmwareVCenterIp: '192.168.1.100',
          login: 'admin',
          password: 'secret',
          vmwareHostMoid: 'host-123',
        } as unknown as Server,
        {
          id: '2',
          vmwareHostMoid: 'host-456',
        } as unknown as Server,
      ];

      await service.initializeIfNeeded(servers);

      expect(redis.safeSet).toHaveBeenCalledWith(
        'metrics:vcenter',
        expect.stringContaining('"ip":"192.168.1.100"'),
      );
      expect(redis.safeLPush).toHaveBeenCalledTimes(2);
    });

    it('should throw error if no servers available', async () => {
      redis.safeGet.mockResolvedValue(null);

      await expect(service.initializeIfNeeded([])).rejects.toThrow(
        'No servers available to extract vCenter configuration',
      );
    });
  });

  describe('getVmMetrics', () => {
    it('should parse and return VM metrics if exists', async () => {
      const metricsJson = '{"powerState":"poweredOn","cpuUsage":250}';
      redis.safeHGet.mockResolvedValue(metricsJson);

      const result = await service.getVmMetrics('vm-123');

      expect(result).toEqual({ powerState: 'poweredOn', cpuUsage: 250 });
      expect(redis.safeHGet).toHaveBeenCalledWith(
        'metrics:metrics',
        '{"type":"VM","moid":"vm-123"}',
      );
    });

    it('should return null if VM metrics do not exist', async () => {
      redis.safeHGet.mockResolvedValue(null);

      const result = await service.getVmMetrics('vm-123');

      expect(result).toBeNull();
    });
  });

  describe('getServerMetrics', () => {
    it('should parse and return server metrics if exists', async () => {
      const metricsJson = '{"powerState":"poweredOn","cpuUsagePercent":15.6}';
      redis.safeHGet.mockResolvedValue(metricsJson);

      const result = await service.getServerMetrics('host-456');

      expect(result).toEqual({
        powerState: 'poweredOn',
        cpuUsagePercent: 15.6,
      });
      expect(redis.safeHGet).toHaveBeenCalledWith(
        'metrics:metrics',
        '{"type":"Server","moid":"host-456"}',
      );
    });

    it('should return null if server metrics do not exist', async () => {
      redis.safeHGet.mockResolvedValue(null);

      const result = await service.getServerMetrics('host-456');

      expect(result).toBeNull();
    });
  });
});
