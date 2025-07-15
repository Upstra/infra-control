import { Test, TestingModule } from '@nestjs/testing';
import { ClearMigrationDataUseCase } from '../clear-migration-data.use-case';
import { MigrationOrchestratorService } from '../../../domain/services/migration-orchestrator.service';

describe('ClearMigrationDataUseCase', () => {
  let useCase: ClearMigrationDataUseCase;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClearMigrationDataUseCase,
        {
          provide: MigrationOrchestratorService,
          useValue: {
            clearMigrationData: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ClearMigrationDataUseCase>(ClearMigrationDataUseCase);
    migrationOrchestrator = module.get(MigrationOrchestratorService);
  });

  describe('execute', () => {
    it('should clear migration data successfully', async () => {
      migrationOrchestrator.clearMigrationData.mockResolvedValue(undefined);

      await useCase.execute();

      expect(migrationOrchestrator.clearMigrationData).toHaveBeenCalledWith();
      expect(migrationOrchestrator.clearMigrationData).toHaveBeenCalledTimes(1);
    });

    it('should pass through any errors from orchestrator', async () => {
      const error = new Error('Failed to clear data');
      migrationOrchestrator.clearMigrationData.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
      expect(migrationOrchestrator.clearMigrationData).toHaveBeenCalledWith();
    });

    it('should be idempotent', async () => {
      migrationOrchestrator.clearMigrationData.mockResolvedValue(undefined);

      await useCase.execute();
      await useCase.execute();

      expect(migrationOrchestrator.clearMigrationData).toHaveBeenCalledTimes(2);
    });

    it('should handle Redis connection errors', async () => {
      const redisError = new Error('Redis connection failed');
      migrationOrchestrator.clearMigrationData.mockRejectedValue(redisError);

      await expect(useCase.execute()).rejects.toThrow(redisError);
    });
  });
});