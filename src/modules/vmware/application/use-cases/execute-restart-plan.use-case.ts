import { Injectable } from '@nestjs/common';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';

@Injectable()
export class ExecuteRestartPlanUseCase {
  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
  ) {}

  async execute(): Promise<{ message: string }> {
    await this.migrationOrchestrator.executeRestartPlan();
    return {
      message: 'Restart plan executed successfully',
    };
  }
}