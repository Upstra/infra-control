import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteRestartPlanUseCase } from '../execute-restart-plan.use-case';
import { MigrationOrchestratorService } from '../../../domain/services/migration-orchestrator.service';

describe('ExecuteRestartPlanUseCase', () => {
  let useCase: ExecuteRestartPlanUseCase;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteRestartPlanUseCase,
        {
          provide: MigrationOrchestratorService,
          useValue: {
            executeRestartPlan: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExecuteRestartPlanUseCase>(ExecuteRestartPlanUseCase);
    migrationOrchestrator = module.get(MigrationOrchestratorService);
  });

  describe('execute', () => {
    it('should execute restart plan successfully', async () => {
      migrationOrchestrator.executeRestartPlan.mockResolvedValue(undefined);

      const result = await useCase.execute();

      expect(result).toEqual({
        message: 'Restart plan executed successfully',
      });
      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledWith();
      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledTimes(1);
    });

    it('should pass through any errors from orchestrator', async () => {
      const error = new Error('Restart failed');
      migrationOrchestrator.executeRestartPlan.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledWith();
    });

    it('should handle specific error types', async () => {
      const badRequestError = new Error('BadRequestException: Invalid state');
      migrationOrchestrator.executeRestartPlan.mockRejectedValue(
        badRequestError,
      );

      await expect(useCase.execute()).rejects.toThrow(badRequestError);
      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent on success', async () => {
      migrationOrchestrator.executeRestartPlan.mockResolvedValue(undefined);

      const result1 = await useCase.execute();
      const result2 = await useCase.execute();

      expect(result1).toEqual(result2);
      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledTimes(2);
    });
  });
});