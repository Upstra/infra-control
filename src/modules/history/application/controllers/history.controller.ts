import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetHistoryListUseCase } from '../use-cases/get-history-list.use-case';
import { HistoryListResponseDto } from '../dto/history.list.response.dto';
import { RoleGuard } from '@/core/guards';
import { RequireRole } from '@/core/decorators/role.decorator';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly getList: GetHistoryListUseCase) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated history events' })
  @RequireRole({ isAdmin: true })
  async getHistory(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<HistoryListResponseDto> {
    return this.getList.execute(Number(page), Number(limit));
  }
}
