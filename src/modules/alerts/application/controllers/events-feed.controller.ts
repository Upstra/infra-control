import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetEventsFeedUseCase } from '../use-cases';
import {
  EventsFeedQueryDto,
  EventsFeedResponseDto,
} from '../dto/events-feed.dto';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsFeedController {
  constructor(private readonly getEventsFeedUseCase: GetEventsFeedUseCase) {}

  @Get('feed')
  @ApiOperation({
    summary: 'Unified feed of alert transitions and user actions',
  })
  @ApiResponse({ status: 200, type: EventsFeedResponseDto })
  feed(@Query() query: EventsFeedQueryDto): Promise<EventsFeedResponseDto> {
    return this.getEventsFeedUseCase.execute(query);
  }
}
