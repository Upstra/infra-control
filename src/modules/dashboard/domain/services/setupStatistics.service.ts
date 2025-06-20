import { Injectable } from '@nestjs/common';

@Injectable()
export class SetupStatisticsService {
  // TODO: Remplacer cette implémentation temporaire par les vraies agrégations
  async getStatistics(): Promise<{
    totalUsers: number;
    adminUsers: number;
    totalRooms: number;
    totalUps: number;
    totalServers: number;
    totalVms: number;
  }> {
    return {
      totalUsers: 100,
      adminUsers: 5,
      totalRooms: 10,
      totalUps: 8,
      totalServers: 20,
      totalVms: 50,
    };
  }
}
