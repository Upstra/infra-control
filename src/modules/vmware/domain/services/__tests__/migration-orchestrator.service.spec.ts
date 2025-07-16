import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MigrationOrchestratorService } from '../migration-orchestrator.service';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { MigrationState } from '../../interfaces/migration-orchestrator.interface';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('MigrationOrchestratorService', () => {
  let service: MigrationOrchestratorService;
  let redisSafeService: jest.Mocked<RedisSafeService>;
  let pythonExecutorService: jest.Mocked<PythonExecutorService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationOrchestratorService,
        {
          provide: RedisSafeService,
          useValue: {
            safeGet: jest.fn(),
            safeSet: jest.fn(),
            safeDel: jest.fn(),
            safeLRange: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PythonExecutorService,
          useValue: {
            executePython: jest.fn(),
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
    redisSafeService = module.get(RedisSafeService);
    pythonExecutorService = module.get(PythonExecutorService);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('executeMigrationPlan', () => {
    const planPath = '/path/to/plan.yml';

    beforeEach(() => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);
    });

    it('should execute migration plan successfully', async () => {
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200, message: 'Success' },
      });

      await service.executeMigrationPlan(planPath);

      expect(fs.access).toHaveBeenCalledWith(planPath);
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.IN_MIGRATION,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.MIGRATED,
      );
      expect(pythonExecutorService.executePython).toHaveBeenCalledWith(
        'migration_plan.py',
        ['--plan', planPath],
        { timeout: 600000 },
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('migration.stateChange', {
        state: MigrationState.IN_MIGRATION,
      });
    });

    it('should throw BadRequestException if not in IDLE state', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IN_MIGRATION);

      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        'Cannot start migration. Current state: in migration',
      );
    });

    it('should throw BadRequestException if plan file not found', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        `Plan file not found: ${planPath}`,
      );
    });

    it('should handle migration failure', async () => {
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 500, message: 'Migration failed' },
      });

      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        'Migration failed',
      );

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.FAILED,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:error',
        'Migration failed',
      );
    });

    it('should handle python executor error', async () => {
      const error = new Error('Python execution failed');
      pythonExecutorService.executePython.mockRejectedValue(error);

      await expect(service.executeMigrationPlan(planPath)).rejects.toThrow(
        error,
      );

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.FAILED,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:error',
        'Python execution failed',
      );
    });

    it('should set end time even on failure', async () => {
      pythonExecutorService.executePython.mockRejectedValue(
        new Error('Failed'),
      );

      try {
        await service.executeMigrationPlan(planPath);
      } catch {
        // Expected to throw
      }

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:end_time',
        expect.any(String),
      );
    });

    it('should poll Redis events after successful migration', async () => {
      const mockEvents = [
        JSON.stringify({ type: 'vm_migration', success: true }),
        JSON.stringify({ type: 'vm_shutdown', success: true }),
      ];
      redisSafeService.safeLRange.mockResolvedValue(mockEvents);
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200 },
      });

      await service.executeMigrationPlan(planPath);

      expect(redisSafeService.safeLRange).toHaveBeenCalledWith(
        'migration:events',
        0,
        -1,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('migration.event', {
        type: 'vm_migration',
        success: true,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('migration.event', {
        type: 'vm_shutdown',
        success: true,
      });
    });
  });

  describe('executeRestartPlan', () => {
    it('should execute restart plan successfully', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.MIGRATED);
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200, message: 'Success' },
      });

      await service.executeRestartPlan();

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.RESTARTING,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:current_operation',
        'Executing restart plan',
      );
      expect(pythonExecutorService.executePython).toHaveBeenCalledWith(
        'restart_plan.py',
        [],
        { timeout: 600000 },
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.IDLE,
      );
      expect(redisSafeService.safeDel).toHaveBeenCalledTimes(6);
    });

    it('should throw BadRequestException if not in MIGRATED state', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);

      await expect(service.executeRestartPlan()).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeRestartPlan()).rejects.toThrow(
        'Cannot start restart. Current state: idle',
      );
    });

    it('should handle restart failure', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.MIGRATED);
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 500, message: 'Restart failed' },
      });

      await expect(service.executeRestartPlan()).rejects.toThrow(
        'Restart failed',
      );

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.FAILED,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:error',
        'Restart failed',
      );
    });

    it('should handle python executor error during restart', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.MIGRATED);
      const error = new Error('Python execution failed');
      pythonExecutorService.executePython.mockRejectedValue(error);

      await expect(service.executeRestartPlan()).rejects.toThrow(error);

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.FAILED,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:error',
        'Python execution failed',
      );
    });
  });

  describe('getMigrationStatus', () => {
    it('should return complete migration status', async () => {
      const mockEvents = [
        JSON.stringify({ type: 'vm_migration', success: true }),
      ];

      redisSafeService.safeGet
        .mockResolvedValueOnce(MigrationState.IN_MIGRATION)
        .mockResolvedValueOnce('Current operation')
        .mockResolvedValueOnce('2023-01-01T00:00:00.000Z')
        .mockResolvedValueOnce('2023-01-01T01:00:00.000Z')
        .mockResolvedValueOnce('Some error');

      redisSafeService.safeLRange.mockResolvedValue(mockEvents);

      const status = await service.getMigrationStatus();

      expect(status).toEqual({
        state: MigrationState.IN_MIGRATION,
        events: [{ type: 'vm_migration', success: true }],
        currentOperation: 'Current operation',
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T01:00:00.000Z',
        error: 'Some error',
      });
    });

    it('should handle empty/null values gracefully', async () => {
      redisSafeService.safeGet.mockResolvedValue(null);
      redisSafeService.safeLRange.mockResolvedValue([]);

      const status = await service.getMigrationStatus();

      expect(status).toEqual({
        state: MigrationState.IDLE,
        events: [],
        currentOperation: undefined,
        startTime: undefined,
        endTime: undefined,
        error: undefined,
      });
    });

    it('should handle invalid JSON in events', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);
      redisSafeService.safeLRange.mockResolvedValue(['invalid json']);

      const status = await service.getMigrationStatus();

      expect(status.events).toEqual([]);
    });
  });

  describe('cancelMigration', () => {
    it('should cancel active migration', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IN_MIGRATION);

      await service.cancelMigration();

      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:state',
        MigrationState.FAILED,
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:error',
        'Migration cancelled by user',
      );
      expect(redisSafeService.safeSet).toHaveBeenCalledWith(
        'migration:end_time',
        expect.any(String),
      );
    });

    it('should throw BadRequestException if no active migration', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);

      await expect(service.cancelMigration()).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelMigration()).rejects.toThrow(
        'No active migration to cancel',
      );
    });

    it('should throw BadRequestException if migration already failed', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.FAILED);

      await expect(service.cancelMigration()).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelMigration()).rejects.toThrow(
        'No active migration to cancel',
      );
    });
  });

  describe('clearMigrationData', () => {
    it('should clear all migration data from Redis', async () => {
      await service.clearMigrationData();

      const expectedKeys = [
        'migration:state',
        'migration:events',
        'migration:current_operation',
        'migration:start_time',
        'migration:end_time',
        'migration:error',
      ];

      expect(redisSafeService.safeDel).toHaveBeenCalledTimes(6);
      expectedKeys.forEach((key) => {
        expect(redisSafeService.safeDel).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('Event emissions', () => {
    it('should emit stateChange event when state changes', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await service.executeMigrationPlan('/plan.yml');

      expect(eventEmitter.emit).toHaveBeenCalledWith('migration.stateChange', {
        state: MigrationState.IN_MIGRATION,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('migration.stateChange', {
        state: MigrationState.MIGRATED,
      });
    });

    it('should emit operationChange event when operation changes', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.MIGRATED);
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200 },
      });

      await service.executeRestartPlan();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'migration.operationChange',
        { operation: 'Executing restart plan' },
      );
    });
  });

  describe('Error handling in private methods', () => {
    it('should handle errors in pollRedisEvents gracefully', async () => {
      redisSafeService.safeGet.mockResolvedValue(MigrationState.IDLE);
      redisSafeService.safeLRange.mockRejectedValue(new Error('Redis error'));
      pythonExecutorService.executePython.mockResolvedValue({
        result: { httpCode: 200 },
      });
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await service.executeMigrationPlan('/plan.yml');

      // Should not throw, error is logged internally
      expect(redisSafeService.safeLRange).toHaveBeenCalled();
    });
  });
});
