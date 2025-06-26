import { Controller, Get, UseGuards, Query, Optional } from '@nestjs/common';
import { FullDashboardStatsDto } from '../dto/fullDashboardStats.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetDashboardFullStatsUseCase } from '../use-cases';
import { GetHistoryStatsUseCase } from '@/modules/history/application/use-cases';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  /**
   * Create a new controller instance.
   *
   * @param getDashboardFullStats - Use case retrieving aggregated dashboard statistics
   */
  constructor(
    private readonly getDashboardFullStats: GetDashboardFullStatsUseCase,
    @Optional() private readonly getHistoryStats?: GetHistoryStatsUseCase,
  ) {}

  @Get('full')
  @ApiOperation({ summary: 'Get full dashboard statistics' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: FullDashboardStatsDto })
  /**
   * Retrieve the full set of dashboard metrics.
   *
   * @returns aggregated statistics used to populate the dashboard view
   */
  async getFullDashboard(): Promise<FullDashboardStatsDto> {
    return this.getDashboardFullStats.execute();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get creation stats for an entity' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getHistory(
    @Query('entity') entity: string,
    @Query('months') months = '6',
  ): Promise<Record<string, number>> {
    return this.getHistoryStats?.execute(entity, Number(months)) ?? {};
  }
}
