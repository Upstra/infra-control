import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetUpsBatteryUseCase } from '../use-cases/get-ups-battery.use-case';
import { GetUpsBatteryStatusPaginatedUseCase } from '../use-cases/get-ups-battery-status-paginated.use-case';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { UpsBatteryStatusPaginatedDto } from '../use-cases/get-ups-battery-status-paginated.use-case';

@ApiTags('UPS Battery')
@Controller('ups/battery')
@UseGuards(JwtAuthGuard)
export class UpsBatteryController {
  constructor(
    private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase,
    private readonly getUpsBatteryStatusPaginatedUseCase: GetUpsBatteryStatusPaginatedUseCase,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get paginated UPS battery status' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'forceRefresh',
    required: false,
    type: Boolean,
    example: false,
  })
  async getBatteryStatusPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('forceRefresh', new DefaultValuePipe(false), ParseBoolPipe)
    forceRefresh: boolean,
  ): Promise<UpsBatteryStatusPaginatedDto> {
    return await this.getUpsBatteryStatusPaginatedUseCase.execute(
      page,
      limit,
      forceRefresh,
    );
  }

  @Get(':upsId')
  @ApiOperation({ summary: 'Get battery status for a specific UPS' })
  @ApiParam({ name: 'upsId', type: String })
  async getBatteryStatus(
    @Param('upsId') upsId: string,
  ): Promise<UPSBatteryStatusDto> {
    return await this.getUpsBatteryUseCase.execute(upsId);
  }
}
