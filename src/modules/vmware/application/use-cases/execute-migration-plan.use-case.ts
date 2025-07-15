import { Injectable } from '@nestjs/common';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';

@Injectable()
export class ExecuteMigrationPlanUseCase {
  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
  ) {}

  async execute(planPath: string): Promise<{ message: string }> {
    await this.migrationOrchestrator.executeMigrationPlan(planPath);
    return {
      message: 'Migration plan started successfully',
    };
  }
}