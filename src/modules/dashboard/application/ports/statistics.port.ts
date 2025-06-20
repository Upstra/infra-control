// src/modules/dashboard/application/ports/statistics.port.ts
export interface StatisticsPort {
  /**
   * Fetch aggregated statistics for the dashboard.
   */
  getStatistics(): Promise<{
    totalUsers: number;
    adminUsers: number;
    totalRooms: number;
    totalUps: number;
    totalServers: number;
    totalVms: number;
  }>;
}
