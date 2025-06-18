import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import { Repository } from 'typeorm';
import { DashboardStatsDto } from '../../application/dto/dashboardStats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Ups)
    private readonly upsRepository: Repository<Ups>,
  ) {}

  async getStats() {
    const totalServers = await this.serverRepository.count();
    const totalUps = await this.upsRepository.count();

    const criticalUpsCount = await this.upsRepository.count({
      where: {
        // to adapt ?
        grace_period_off: 100,
      },
    });

    const recentServers = await this.serverRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const dashboardStats: DashboardStatsDto = {
      totalServers,
      totalUps,
      criticalUpsCount,
    };

    return dashboardStats;
  }
}
