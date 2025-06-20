// src/modules/dashboard/infrastructure/adapters/setup-statistics.adapter.ts
import { Inject, Injectable } from '@nestjs/common';
import { StatisticsPort } from '../../application/ports/statistics.port';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '@/modules/ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';

@Injectable()
export class SetupStatisticsAdapter implements StatisticsPort {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepo: UserRepositoryInterface,

    @Inject('RoomRepositoryInterface')
    private readonly roomRepo: RoomRepositoryInterface,

    @Inject('UpsRepositoryInterface')
    private readonly upsRepo: UpsRepositoryInterface,

    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,

    @Inject('VmRepositoryInterface')
    private readonly vmRepo: VmRepositoryInterface,
  ) {}

  async getStatistics() {
    const [totalUsers, adminUsers] = await Promise.all([
      this.userRepo.count(),
      99,
    ]);

    const [totalRooms, totalUps] = await Promise.all([
      this.roomRepo.count(),
      this.upsRepo.count(),
    ]);

    const [totalServers, totalVms] = await Promise.all([
      this.serverRepo.count(),
      this.vmRepo.count(),
    ]);

    return {
      totalUsers,
      adminUsers,
      totalRooms,
      totalUps,
      totalServers,
      totalVms,
    };
  }
}
