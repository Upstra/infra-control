// src/modules/dashboard/application/ports/statistics.port.ts
export interface StatisticsPort {
  getStatistics(): Promise<{
    totalUsers: number;
    adminUsers: number;
    totalRooms: number;
    totalUps: number;
    totalServers: number;
    totalVms: number;
  }>;
}
