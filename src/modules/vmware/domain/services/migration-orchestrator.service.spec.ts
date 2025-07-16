import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { MigrationOrchestratorService } from './migration-orchestrator.service';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { RequestContextDto } from '@/core/dto/request-context.dto';
import { MigrationState } from '../interfaces/migration-orchestrator.interface';

jest.mock('fs/promises');
jest.mock('js-yaml');

describe('MigrationOrchestratorService', () => {
  let service: MigrationOrchestratorService;
  let redis: jest.Mocked<RedisSafeService>;
  let pythonExecutor: jest.Mocked<PythonExecutorService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;
  let vmRepository: jest.Mocked<VmRepositoryInterface>;

  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockYaml = yaml as jest.Mocked<typeof yaml>;

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
            safeLRange: jest.fn(),
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
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
        {
          provide: 'VmRepositoryInterface',
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MigrationOrchestratorService>(MigrationOrchestratorService);
    redis = module.get(RedisSafeService);
    pythonExecutor = module.get(PythonExecutorService);
    eventEmitter = module.get(EventEmitter2);
    logHistoryUseCase = module.get(LogHistoryUseCase);
    vmRepository = module.get('VmRepositoryInterface');

    jest.clearAllMocks();
  });

  describe('executeMigrationPlan with logging', () => {
    const planPath = '/path/to/migration-plan.yaml';
    const userId = 'user-123';
    const requestContext = RequestContextDto.forTesting({
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent',
      correlationId: 'test-correlation',
    });

    const mockPlanContent = {
      servers: [
        {
          host: { name: 'ESXi-01' },
          destination: { name: 'ESXi-03' },
          vm_order: ['vm-123', 'vm-456'],
        },
        {
          host: { name: 'ESXi-02' },
          vm_order: ['vm-789'],
        },
      ],
      ups: { shutdown_grace: 60 },
    };

    beforeEach(() => {
      redis.safeGet.mockResolvedValue(MigrationState.IDLE);
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(yaml.dump(mockPlanContent));
      mockYaml.load.mockReturnValue(mockPlanContent);
      pythonExecutor.executePython.mockResolvedValue({ stdout: 'Success' });
      redis.safeLRange.mockResolvedValue([]);
    });

    it('should log migration start with analyzed plan details', async () => {
      vmRepository.findOne
        .mockResolvedValueOnce({ name: 'VM-Web' } as any)
        .mockResolvedValueOnce({ name: 'VM-DB' } as any)
        .mockResolvedValueOnce({ name: 'VM-App' } as any);

      await service.executeMigrationPlan(planPath, userId, requestContext);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'migration',
        entityId: 'test-correlation',
        action: 'START_MIGRATION',
        userId: 'user-123',
        metadata: {
          migrationType: 'migration',
          planPath,
          sourceServers: ['ESXi-01', 'ESXi-02'],
          destinationServers: ['ESXi-03'],
          affectedVms: [
            { moid: 'vm-123', name: 'VM-Web', sourceServer: 'ESXi-01', destinationServer: 'ESXi-03' },
            { moid: 'vm-456', name: 'VM-DB', sourceServer: 'ESXi-01', destinationServer: 'ESXi-03' },
            { moid: 'vm-789', name: 'VM-App', sourceServer: 'ESXi-02', destinationServer: undefined },
          ],
          totalVmsCount: 3,
          hasDestination: true,
          upsGracePeriod: 60,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
      });
    });

    it('should log successful migration completion', async () => {
      const mockEvents = [
        JSON.stringify({ type: 'VMMigrationEvent', success: true }),
        JSON.stringify({ type: 'VMShutdownEvent', success: true }),
        JSON.stringify({ type: 'VMMigrationEvent', success: false }),
      ];
      redis.safeLRange.mockResolvedValue(mockEvents);

      await service.executeMigrationPlan(planPath, userId, requestContext);

      expect(logHistoryUseCase.executeStructured).toHaveBeenLastCalledWith(
        expect.objectContaining({
          entity: 'migration',
          entityId: 'test-correlation',
          action: 'COMPLETE_MIGRATION',
          userId: 'user-123',
          metadata: expect.objectContaining({
            migrationType: 'migration',
            result: 'success',
            successfulVms: 2,
            failedVms: 1,
          }),
        }),
      );
    });

    it('should log failed migration', async () => {
      pythonExecutor.executePython.mockRejectedValue(new Error('Python script failed'));

      await expect(service.executeMigrationPlan(planPath, userId, requestContext)).rejects.toThrow(
        'Python script failed',
      );

      expect(logHistoryUseCase.executeStructured).toHaveBeenLastCalledWith(
        expect.objectContaining({
          entity: 'migration',
          entityId: 'test-correlation',
          action: 'FAILED_MIGRATION',
          userId: 'user-123',
          metadata: expect.objectContaining({
            result: 'failed',
            errorMessage: 'Python script failed',
          }),
        }),
      );
    });

    it('should handle shutdown-only migration type', async () => {
      const shutdownPlan = {
        servers: [
          {
            host: { name: 'ESXi-01' },
            vm_order: ['vm-123'],
          },
        ],
        ups: { shutdown_grace: 30 },
      };
      mockYaml.load.mockReturnValue(shutdownPlan);

      await service.executeMigrationPlan(planPath, userId, requestContext);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            migrationType: 'shutdown',
            hasDestination: false,
            destinationServers: [],
          }),
        }),
      );
    });

    it('should continue even if plan analysis fails', async () => {
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      await service.executeMigrationPlan(planPath, userId, requestContext);

      expect(pythonExecutor.executePython).toHaveBeenCalled();
    });

    it('should work without logging when logHistoryUseCase is not provided', async () => {
      const serviceWithoutLogging = new MigrationOrchestratorService(
        redis as any,
        pythonExecutor as any,
        eventEmitter as any,
      );

      await serviceWithoutLogging.executeMigrationPlan(planPath, userId, requestContext);

      expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
      expect(pythonExecutor.executePython).toHaveBeenCalled();
    });
  });

  describe('executeRestartPlan with logging', () => {
    const userId = 'user-123';
    const requestContext = RequestContextDto.forTesting();

    beforeEach(() => {
      redis.safeGet.mockResolvedValue(MigrationState.MIGRATED);
      pythonExecutor.executePython.mockResolvedValue({ stdout: 'Success' });
    });

    it('should log restart start and completion', async () => {
      await service.executeRestartPlan(userId, requestContext);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledTimes(2);

      expect(logHistoryUseCase.executeStructured).toHaveBeenNthCalledWith(1, {
        entity: 'migration',
        entityId: expect.stringContaining('restart-'),
        action: 'START_RESTART',
        userId: 'user-123',
        metadata: {
          migrationType: 'restart',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(logHistoryUseCase.executeStructured).toHaveBeenNthCalledWith(2, {
        entity: 'migration',
        entityId: expect.stringContaining('restart-'),
        action: 'COMPLETE_RESTART',
        userId: 'user-123',
        metadata: {
          migrationType: 'restart',
          duration: expect.any(Number),
          result: 'success',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should log failed restart', async () => {
      pythonExecutor.executePython.mockRejectedValue(new Error('Restart failed'));

      await expect(service.executeRestartPlan(userId, requestContext)).rejects.toThrow(
        'Restart failed',
      );

      expect(logHistoryUseCase.executeStructured).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'FAILED_RESTART',
          metadata: expect.objectContaining({
            result: 'failed',
            errorMessage: 'Restart failed',
          }),
        }),
      );
    });
  });

  describe('analyzeMigrationPlan', () => {
    it('should enrich VM info with names from repository', async () => {
      const planContent = yaml.dump({
        servers: [
          {
            host: { name: 'ESXi-01' },
            destination: { name: 'ESXi-02' },
            vm_order: ['vm-123'],
          },
        ],
      });
      mockFs.readFile.mockResolvedValue(planContent);
      mockYaml.load.mockReturnValue(yaml.load(planContent));
      vmRepository.findOne.mockResolvedValue({ name: 'TestVM' } as any);

      const result = await service['analyzeMigrationPlan']('/path/to/plan.yaml');

      expect(result.affectedVms[0]).toEqual({
        moid: 'vm-123',
        name: 'TestVM',
        sourceServer: 'ESXi-01',
        destinationServer: 'ESXi-02',
      });
    });

    it('should handle VM repository errors gracefully', async () => {
      const planContent = yaml.dump({
        servers: [
          {
            host: { name: 'ESXi-01' },
            vm_order: ['vm-123'],
          },
        ],
      });
      mockFs.readFile.mockResolvedValue(planContent);
      mockYaml.load.mockReturnValue(yaml.load(planContent));
      vmRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service['analyzeMigrationPlan']('/path/to/plan.yaml');

      expect(result.affectedVms[0].name).toBeUndefined();
    });
  });
});