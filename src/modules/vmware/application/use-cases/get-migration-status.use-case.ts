import { Injectable } from '@nestjs/common';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';
import { MigrationStatus } from '../../domain/interfaces/migration-orchestrator.interface';

@Injectable()
export class GetMigrationStatusUseCase {
  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
  ) {}

  async execute(): Promise<MigrationStatus> {
    return await this.migrationOrchestrator.getMigrationStatus();
  }
}
