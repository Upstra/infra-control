import { Inject, Injectable } from '@nestjs/common';

import { SetupProgress } from '@/modules/setup/domain/entities/setup-progress.entity';
import { SetupStep } from '@/modules/setup/application/dto';
import { FullDashboardStatsDto } from '../dto/fullDashboardStats.dto';
import { SetupProgressRepositoryInterface } from '@/modules/setup/domain/interfaces/setup.repository.interface';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PresenceService } from '@/modules/presence/application/services/presence.service';
import { StatisticsPort } from '../ports/statistics.port';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';

@Injectable()
export class GetDashboardFullStatsUseCase {
  private readonly CACHE_KEY = 'dashboard:full-stats';
  private readonly CACHE_TTL = 60; // 60 seconds

  /**
   * Instantiate the use case with all required dependencies.
   *
   * @param statisticsPort - Adapter providing base statistics
   * @param presencePort - Service used to count currently connected users
   * @param serverPort - Repository for retrieving servers
   * @param vmPort - Repository for retrieving virtual machines
   * @param setupProgressRepo - Repository handling setup progress records
   * @param redisService - Redis service for caching
   */
  constructor(
    @Inject('StatisticsPort')
    private readonly statisticsPort: StatisticsPort,
    private readonly presencePort: PresenceService,
    @Inject('ServerRepositoryInterface')
    private readonly serverPort: ServerRepositoryInterface,
    @Inject('VmRepositoryInterface')
    private readonly vmPort: VmRepositoryInterface,
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
    private readonly redisService: RedisSafeService,
  ) {}

  /**
   * Build the complete dashboard statistics DTO by aggregating data
   * from multiple repositories and services.
   *
   * @returns `FullDashboardStatsDto` containing counts and setup progress
   */
  async execute(): Promise<FullDashboardStatsDto> {
    const cached = await this.redisService.safeGet(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const [
      stats,
      onlineUsers,
      serversUp,
      serversDown,
      vmsUp,
      vmsDown,
      progressRecords,
    ] = await Promise.all([
      this.statisticsPort.getStatistics(),
      this.presencePort.getConnectedUserCount(),
      this.serverPort.countByState('UP'),
      this.serverPort.countByState('DOWN'),
      this.vmPort.countByState('UP'),
      this.vmPort.countByState('DOWN'),
      this.setupProgressRepo.findAll(),
    ]);

    const progressPercentage = this.computeProgress(progressRecords);

    const result: FullDashboardStatsDto = {
      ...stats,
      serversUp,
      serversDown,
      vmsUp,
      vmsDown,
      setupComplete: progressRecords.some(
        (record) => record.step === SetupStep.COMPLETE,
      ),
      setupProgress: progressPercentage,
      onlineUsers,
    };

    await this.redisService.safeSet(
      this.CACHE_KEY,
      JSON.stringify(result),
    );
    await this.redisService.safeExpire(this.CACHE_KEY, this.CACHE_TTL);

    return result;
  }

  /**
   * Compute the percentage completion of the setup process.
   *
   * @param records - Existing setup progress entries
   * @returns a whole number between 0 and 100 representing completion
   */
  private computeProgress(records: SetupProgress[]): number {
    const completed = new Set(
      records.map((r) => r.step).filter((s) => s !== SetupStep.COMPLETE),
    );
    const total = Object.values(SetupStep).filter(
      (s) => s !== SetupStep.COMPLETE,
    ).length;
    return total === 0 ? 0 : Math.round((completed.size / total) * 100);
  }
}
