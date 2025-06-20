import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../../domain/services/dashboard.service';
import { FullDashboardStatsDto } from '../dto/fullDashboardStats.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('full')
  @ApiOperation({ summary: 'Get full dashboard statistics' })
  @ApiResponse({ status: 200, type: FullDashboardStatsDto })
  async getFullDashboard(): Promise<FullDashboardStatsDto> {
    return this.dashboardService.getFullStats();
  }
}
