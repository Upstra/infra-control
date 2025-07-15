import { Injectable } from '@nestjs/common';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';

@Injectable()
export class ClearMigrationDataUseCase {
  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
  ) {}

  async execute(): Promise<void> {
    await this.migrationOrchestrator.clearMigrationData();
  }
}
