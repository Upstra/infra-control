import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetMetricSeriesUseCase } from '../use-cases/get-metric-series.use-case';
import {
  MetricSeriesQueryDto,
  MetricSeriesResponseDto,
} from '../dto/metric-series.dto';

@ApiTags('Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('metrics')
export class MetricSeriesController {
  constructor(
    private readonly getMetricSeriesUseCase: GetMetricSeriesUseCase,
  ) {}

  @Get('series')
  @ApiOperation({
    summary: 'Historical series from Prometheus for a whitelisted metric',
  })
  @ApiResponse({ status: 200, type: MetricSeriesResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Metric, scope, id or range not allowed',
  })
  @ApiResponse({ status: 503, description: '{ code: "HISTORY_UNAVAILABLE" }' })
  series(
    @Query() query: MetricSeriesQueryDto,
  ): Promise<MetricSeriesResponseDto> {
    return this.getMetricSeriesUseCase.execute(query);
  }
}
