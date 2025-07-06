import { Controller, Get, Query, UseGuards, UseFilters } from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetHistoryListUseCase } from '../use-cases/get-history-list.use-case';
import { GetHistoryEntityTypesUseCase } from '../use-cases/get-entity-types.use-case';
import { GetHistoryStatisticsUseCase } from '../use-cases/get-history-statistics.use-case';
import { HistoryListResponseDto } from '../dto/history.list.response.dto';
import { EntityTypesResponseDto } from '../dto/entity-types.response.dto';
import { HistoryStatsResponseDto } from '../dto/history-stats-response.dto';
import { RoleGuard } from '@/core/guards';
import { RequireRole } from '@/core/decorators/role.decorator';
import { InvalidQueryExceptionFilter } from '@/core/filters/invalid-query.exception.filter';
import { HistoryListFilters } from '../../domain/interfaces/history-filter.interface';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(
    private readonly getList: GetHistoryListUseCase,
    private readonly getEntityTypesUseCase: GetHistoryEntityTypesUseCase,
    private readonly getHistoryStatisticsUseCase: GetHistoryStatisticsUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @UseFilters(InvalidQueryExceptionFilter)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated history events' })
  @RequireRole({ isAdmin: true })
  @ApiResponse({ status: 200, type: HistoryListResponseDto })
  async getHistory(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<HistoryListResponseDto> {
    const filters: HistoryListFilters = {};
    if (action) filters.action = action;
    if (entity) filters.entity = entity;
    if (userId) filters.userId = userId;
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);

    return this.getList.execute(Number(page), Number(limit), filters);
  }

  @Get('entity-types')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available entity types for history' })
  @RequireRole({ isAdmin: true })
  @ApiResponse({ status: 200, type: EntityTypesResponseDto })
  async getEntityTypes(): Promise<EntityTypesResponseDto> {
    return this.getEntityTypesUseCase.execute();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get history statistics' })
  @RequireRole({ isAdmin: true })
  @ApiResponse({ status: 200, type: HistoryStatsResponseDto })
  async getStats(): Promise<HistoryStatsResponseDto> {
    return this.getHistoryStatisticsUseCase.execute();
  }
}
