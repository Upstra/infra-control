import { Inject, Injectable } from '@nestjs/common';

import { SetupProgress } from '@/modules/setup/domain/entities/setup-progress.entity';
import { SetupStep } from '@/modules/setup/application/dto';
import { FullDashboardStatsDto } from '../dto/fullDashboardStats.dto';
import { SetupProgressRepositoryInterface } from '@/modules/setup/domain/interfaces/setup.repository.interface';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { PresenceService } from '@/modules/presence/application/services/presence.service';
import { StatisticsPort } from '../ports/statistics.port';

@Injectable()
export class GetDashboardFullStatsUseCase {
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
  ) {}

  async execute(): Promise<FullDashboardStatsDto> {
    const stats = await this.statisticsPort.getStatistics();
    const onlineUsers = await this.presencePort.getConnectedUserCount();

    const servers = await this.serverPort.findAll();
    const vms = await this.vmPort.findAll();

    const serversUp = servers.filter(({ state }) => state === 'UP').length;
    const serversDown = servers.length - serversUp;
    const vmsUp = vms.filter(({ state }) => state === 'UP').length;
    const vmsDown = vms.length - vmsUp;

    const progressRecords = await this.setupProgressRepo.findAll();
    const progressPercentage = this.computeProgress(progressRecords);

    return {
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
  }

  private computeProgress(records: SetupProgress[]): number {
    const completed = new Set(records.map((r) => r.step));
    const total = Object.values(SetupStep).filter(
      (s) => s !== SetupStep.COMPLETE,
    ).length;
    return total === 0 ? 0 : Math.round((completed.size / total) * 100);
  }
}
