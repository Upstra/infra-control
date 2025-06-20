import { Inject, Injectable } from '@nestjs/common';
import { SetupStatisticsService } from './setupStatistics.service';
import { SetupStatusService } from './setupStatus.service';
import { PresenceService } from '@/modules/presence/application/services/presence.service';
import { ServerTypeormRepository } from '@/modules/servers/infrastructure/repositories/server.typeorm.repository';
import { VmTypeormRepository } from '@/modules/vms/infrastructure/repositories/vm.typeorm.repository';
import { FullDashboardStatsDto } from '../../application/dto/fullDashboardStats.dto';
import { SetupProgressRepositoryInterface } from '@/modules/setup/domain/interfaces/setup.repository.interface';
import { SetupProgress } from '@/modules/setup/domain/entities/setup-progress.entity';
import { SetupStep } from '@/modules/setup/application/dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly setupStatisticsService: SetupStatisticsService,
    private readonly setupStatusService: SetupStatusService,
    private readonly presenceService: PresenceService,
    private readonly serverRepository: ServerTypeormRepository,
    private readonly vmRepository: VmTypeormRepository,
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
  ) {}

  async getFullStats(): Promise<FullDashboardStatsDto> {
    const stats = await this.setupStatisticsService.getStatistics();
    const setupStatus = await this.setupStatusService.getStatus();
    const onlineUsers = await this.presenceService.getConnectedUserCount();

    const servers = await this.serverRepository.findAll();
    const vms = await this.vmRepository.findAll();

    const serversUp = servers.filter((s) => s.state === 'UP').length;
    const serversDown = servers.filter((s) => s.state === 'DOWN').length;
    const vmsUp = vms.filter((v) => v.state === 'UP').length;
    const vmsDown = vms.filter((v) => v.state === 'DOWN').length;

    const setupProgressRecords = await this.setupProgressRepo.findAll();
    const progressPercentage = this.calculateProgress(setupProgressRecords);

    return {
      totalUsers: stats.totalUsers,
      adminUsers: stats.adminUsers,
      totalRooms: stats.totalRooms,
      totalUps: stats.totalUps,
      totalServers: stats.totalServers,
      totalVms: stats.totalVms,

      serversUp,
      serversDown,
      vmsUp,
      vmsDown,

      setupComplete: setupStatus.isComplete,
      setupProgress: progressPercentage,
      onlineUsers,
    };
  }

  private calculateProgress(records: SetupProgress[]): number {
    const completedSteps = new Set(records.map((record) => record.step));

    const totalSteps = Object.values(SetupStep).filter(
      (s) => s !== SetupStep.COMPLETE,
    ).length;

    return totalSteps === 0
      ? 0
      : Math.round((completedSteps.size / totalSteps) * 100);
  }
}
