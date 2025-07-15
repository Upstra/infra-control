import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteMigrationPlanUseCase } from '../execute-migration-plan.use-case';
import { MigrationOrchestratorService } from '../../../domain/services/migration-orchestrator.service';

describe('ExecuteMigrationPlanUseCase', () => {
  let useCase: ExecuteMigrationPlanUseCase;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecuteMigrationPlanUseCase,
        {
          provide: MigrationOrchestratorService,
          useValue: {
            executeMigrationPlan: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ExecuteMigrationPlanUseCase>(
      ExecuteMigrationPlanUseCase,
    );
    migrationOrchestrator = module.get(MigrationOrchestratorService);
  });

  describe('execute', () => {
    it('should execute migration plan successfully', async () => {
      const planPath = '/path/to/plan.yml';
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue(undefined);

      const result = await useCase.execute(planPath);

      expect(result).toEqual({
        message: 'Migration plan started successfully',
      });
      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        planPath,
      );
      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledTimes(1);
    });

    it('should pass through any errors from orchestrator', async () => {
      const planPath = '/path/to/plan.yml';
      const error = new Error('Migration failed');
      migrationOrchestrator.executeMigrationPlan.mockRejectedValue(error);

      await expect(useCase.execute(planPath)).rejects.toThrow(error);
      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        planPath,
      );
    });

    it('should handle empty plan path', async () => {
      const planPath = '';
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue(undefined);

      const result = await useCase.execute(planPath);

      expect(result).toEqual({
        message: 'Migration plan started successfully',
      });
      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        planPath,
      );
    });

    it('should handle special characters in plan path', async () => {
      const planPath = '/path/with spaces/and-special@chars.yml';
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue(undefined);

      const result = await useCase.execute(planPath);

      expect(result).toEqual({
        message: 'Migration plan started successfully',
      });
      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        planPath,
      );
    });
  });
});