import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './application/controllers/health.controller';
import { GetHealthStatusUseCase } from './application/use-cases/get-health-status.use-case';
import { DatabaseHealthService } from './domain/services/database-health.service';
import { RedisHealthService } from './domain/services/redis-health.service';
import { SystemHealthService } from './domain/services/system-health.service';
import { GitHubHealthService } from './domain/services/github-health.service';

@Module({
  imports: [
    // TypeORM connection is needed for database health checks
    TypeOrmModule.forFeature([]),
  ],
  controllers: [HealthController],
  providers: [
    GetHealthStatusUseCase,
    DatabaseHealthService,
    RedisHealthService,
    SystemHealthService,
    GitHubHealthService,
  ],
  exports: [
    GetHealthStatusUseCase,
    DatabaseHealthService,
    RedisHealthService,
    SystemHealthService,
    GitHubHealthService,
  ],
})
export class HealthModule {}
