import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MigrationOrchestratorService } from '../migration-orchestrator.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

describe('MigrationOrchestratorService - Event Mapping', () => {
  let service: MigrationOrchestratorService;
  let redis: jest.Mocked<RedisSafeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationOrchestratorService,
        {
          provide: PythonExecutorService,
          useValue: {
            executePython: jest.fn(),
          },
        },
        {
          provide: RedisSafeService,
          useValue: {
            safeGet: jest.fn(),
            safeSet: jest.fn(),
            safeDel: jest.fn(),
            safeLRange: jest.fn(),
            safeExpire: jest.fn(),
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

    service = module.get<MigrationOrchestratorService>(
      MigrationOrchestratorService,
    );
    redis = module.get(RedisSafeService);
  });

  describe('VMware Event Mapping', () => {
    it('should map VMStartedEvent to vm_started', () => {
      const vmwareEvent = {
        type: 'VMStartedEvent',
        vm: 'TestVM',
        vmMoid: 'vm-123',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'vm_started',
        timestamp: '2025-01-01T00:00:00Z',
        vmName: 'TestVM',
        vmMoid: 'vm-123',
        success: true,
      });
    });

    it('should map VMMigrationEvent to vm_migration', () => {
      const vmwareEvent = {
        type: 'VMMigrationEvent',
        vm: 'TestVM',
        vmMoid: 'vm-123',
        source: 'host-1',
        destination: 'host-2',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'vm_migration',
        timestamp: '2025-01-01T00:00:00Z',
        vmName: 'TestVM',
        vmMoid: 'vm-123',
        sourceMoid: 'host-1',
        destinationMoid: 'host-2',
        success: true,
      });
    });

    it('should map VMShutdownEvent to vm_shutdown', () => {
      const vmwareEvent = {
        type: 'VMShutdownEvent',
        vm: 'TestVM',
        vmMoid: 'vm-123',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'vm_shutdown',
        timestamp: '2025-01-01T00:00:00Z',
        vmName: 'TestVM',
        vmMoid: 'vm-123',
        success: true,
      });
    });

    it('should map ServerShutdownEvent to server_shutdown', () => {
      const vmwareEvent = {
        type: 'ServerShutdownEvent',
        server: 'ESXi-Host1',
        serverMoid: 'host-123',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'server_shutdown',
        timestamp: '2025-01-01T00:00:00Z',
        serverName: 'ESXi-Host1',
        serverMoid: 'host-123',
        success: true,
      });
    });

    it('should handle error events', () => {
      const vmwareEvent = {
        type: 'VMShutdownEvent',
        vm: 'TestVM',
        vmMoid: 'vm-123',
        error: 'Failed to shutdown VM',
        timestamp: '2025-01-01T00:00:00Z',
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'vm_shutdown',
        timestamp: '2025-01-01T00:00:00Z',
        vmName: 'TestVM',
        vmMoid: 'vm-123',
        success: false,
        error: 'Failed to shutdown VM',
      });
    });

    it('should add message if present', () => {
      const vmwareEvent = {
        type: 'VMStartedEvent',
        vm: 'TestVM',
        vmMoid: 'vm-123',
        message: 'VM started successfully on new host',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'vm_started',
        timestamp: '2025-01-01T00:00:00Z',
        vmName: 'TestVM',
        vmMoid: 'vm-123',
        success: true,
        message: 'VM started successfully on new host',
      });
    });

    it('should handle unknown event types', () => {
      const vmwareEvent = {
        type: 'UnknownEvent',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      };

      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);

      expect(result).toEqual({
        type: 'UnknownEvent',
        timestamp: '2025-01-01T00:00:00Z',
        success: true,
      });
    });

    it('should generate timestamp if not provided', () => {
      const vmwareEvent = {
        type: 'VMStartedEvent',
        vm: 'TestVM',
        success: true,
      };

      const before = new Date().toISOString();
      const result = service['mapVmwareEventToMigrationEvent'](vmwareEvent);
      const after = new Date().toISOString();

      expect(result.type).toBe('vm_started');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime(),
      );
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(after).getTime(),
      );
    });
  });

  describe('getEvents', () => {
    it('should transform VMware events when fetching from Redis', async () => {
      const rawEvents = [
        JSON.stringify({
          type: 'VMShutdownEvent',
          vm: 'TestVM',
          vmMoid: 'vm-123',
          timestamp: '2025-01-01T00:00:00Z',
          success: true,
        }),
        JSON.stringify({
          type: 'vm_started',
          vmName: 'AnotherVM',
          vmMoid: 'vm-456',
          timestamp: '2025-01-01T00:01:00Z',
          success: true,
        }),
      ];

      redis.safeLRange.mockResolvedValue(rawEvents);

      const result = await service['getEvents']();

      expect(result).toEqual([
        {
          type: 'vm_shutdown',
          timestamp: '2025-01-01T00:00:00Z',
          vmName: 'TestVM',
          vmMoid: 'vm-123',
          success: true,
        },
        {
          type: 'vm_started',
          vmName: 'AnotherVM',
          vmMoid: 'vm-456',
          timestamp: '2025-01-01T00:01:00Z',
          success: true,
        },
      ]);
    });

    it('should handle empty event list', async () => {
      redis.safeLRange.mockResolvedValue([]);

      const result = await service['getEvents']();

      expect(result).toEqual([]);
    });

    it('should handle Redis errors gracefully', async () => {
      redis.safeLRange.mockRejectedValue(new Error('Redis error'));

      const result = await service['getEvents']();

      expect(result).toEqual([]);
    });
  });
});
