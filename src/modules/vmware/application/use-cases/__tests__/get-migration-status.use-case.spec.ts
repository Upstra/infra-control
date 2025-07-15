import { Test, TestingModule } from '@nestjs/testing';
import { GetMigrationStatusUseCase } from '../get-migration-status.use-case';
import { MigrationOrchestratorService } from '../../../domain/services/migration-orchestrator.service';
import {
  MigrationState,
  MigrationStatus,
} from '../../../domain/interfaces/migration-orchestrator.interface';

describe('GetMigrationStatusUseCase', () => {
  let useCase: GetMigrationStatusUseCase;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMigrationStatusUseCase,
        {
          provide: MigrationOrchestratorService,
          useValue: {
            getMigrationStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetMigrationStatusUseCase>(GetMigrationStatusUseCase);
    migrationOrchestrator = module.get(MigrationOrchestratorService);
  });

  describe('execute', () => {
    it('should return migration status successfully', async () => {
      const mockStatus: MigrationStatus = {
        state: MigrationState.IN_MIGRATION,
        events: [
          {
            type: 'vm_migration',
            timestamp: '2023-01-01T00:00:00.000Z',
            vmName: 'test-vm',
            success: true,
          },
        ],
        currentOperation: 'Migrating VMs',
        startTime: '2023-01-01T00:00:00.000Z',
      };

      migrationOrchestrator.getMigrationStatus.mockResolvedValue(mockStatus);

      const result = await useCase.execute();

      expect(result).toEqual(mockStatus);
      expect(migrationOrchestrator.getMigrationStatus).toHaveBeenCalledWith();
      expect(migrationOrchestrator.getMigrationStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle empty migration status', async () => {
      const emptyStatus: MigrationStatus = {
        state: MigrationState.IDLE,
        events: [],
      };

      migrationOrchestrator.getMigrationStatus.mockResolvedValue(emptyStatus);

      const result = await useCase.execute();

      expect(result).toEqual(emptyStatus);
      expect(result.state).toBe(MigrationState.IDLE);
      expect(result.events).toEqual([]);
      expect(result.currentOperation).toBeUndefined();
    });

    it('should handle failed migration status', async () => {
      const failedStatus: MigrationStatus = {
        state: MigrationState.FAILED,
        events: [
          {
            type: 'vm_migration',
            timestamp: '2023-01-01T00:00:00.000Z',
            vmName: 'test-vm',
            success: false,
            error: 'Migration failed',
          },
        ],
        error: 'Overall migration failed',
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:10:00.000Z',
      };

      migrationOrchestrator.getMigrationStatus.mockResolvedValue(failedStatus);

      const result = await useCase.execute();

      expect(result).toEqual(failedStatus);
      expect(result.state).toBe(MigrationState.FAILED);
      expect(result.error).toBe('Overall migration failed');
    });

    it('should handle completed migration with all fields', async () => {
      const completedStatus: MigrationStatus = {
        state: MigrationState.MIGRATED,
        events: [
          {
            type: 'vm_migration',
            timestamp: '2023-01-01T00:00:00.000Z',
            vmName: 'vm1',
            vmMoid: 'vm-123',
            sourceMoid: 'host-1',
            destinationMoid: 'host-2',
            success: true,
          },
          {
            type: 'vm_shutdown',
            timestamp: '2023-01-01T00:05:00.000Z',
            vmName: 'vm2',
            vmMoid: 'vm-456',
            success: true,
          },
          {
            type: 'server_shutdown',
            timestamp: '2023-01-01T00:10:00.000Z',
            serverMoid: 'server-789',
            serverName: 'esxi-01',
            success: true,
          },
        ],
        currentOperation: undefined,
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:15:00.000Z',
      };

      migrationOrchestrator.getMigrationStatus.mockResolvedValue(
        completedStatus,
      );

      const result = await useCase.execute();

      expect(result).toEqual(completedStatus);
      expect(result.events).toHaveLength(3);
    });

    it('should pass through any errors from orchestrator', async () => {
      const error = new Error('Failed to get status');
      migrationOrchestrator.getMigrationStatus.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
      expect(migrationOrchestrator.getMigrationStatus).toHaveBeenCalledWith();
    });

    it('should handle restarting state', async () => {
      const restartingStatus: MigrationStatus = {
        state: MigrationState.RESTARTING,
        events: [],
        currentOperation: 'Restarting servers',
      };

      migrationOrchestrator.getMigrationStatus.mockResolvedValue(
        restartingStatus,
      );

      const result = await useCase.execute();

      expect(result.state).toBe(MigrationState.RESTARTING);
      expect(result.currentOperation).toBe('Restarting servers');
    });
  });
});