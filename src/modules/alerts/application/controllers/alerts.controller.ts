import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  AcknowledgeAlertUseCase,
  GetAlertByIdUseCase,
  GetAlertSummaryUseCase,
  ListAlertsUseCase,
} from '../use-cases';
import { AlertListQueryDto } from '../dto/alert-list.query.dto';
import {
  AlertListResponseDto,
  AlertResponseDto,
  AlertSummaryResponseDto,
} from '../dto/alert.response.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly listAlertsUseCase: ListAlertsUseCase,
    private readonly getAlertSummaryUseCase: GetAlertSummaryUseCase,
    private readonly getAlertByIdUseCase: GetAlertByIdUseCase,
    private readonly acknowledgeAlertUseCase: AcknowledgeAlertUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List alerts, sorted by severity then most recent first',
  })
  @ApiResponse({ status: 200, type: AlertListResponseDto })
  list(@Query() query: AlertListQueryDto): Promise<AlertListResponseDto> {
    return this.listAlertsUseCase.execute(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Open alert counters for the bell and nav badge' })
  @ApiResponse({ status: 200, type: AlertSummaryResponseDto })
  summary(): Promise<AlertSummaryResponseDto> {
    return this.getAlertSummaryUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Alert detail with its transitions' })
  @ApiResponse({ status: 200, type: AlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AlertResponseDto> {
    return this.getAlertByIdUseCase.execute(id);
  }

  @Post(':id/acknowledge')
  @HttpCode(200)
  @ApiOperation({ summary: 'Acknowledge an open alert' })
  @ApiResponse({ status: 200, type: AlertResponseDto })
  @ApiResponse({ status: 403, description: 'No permission on the resource' })
  @ApiResponse({ status: 409, description: 'Alert already resolved' })
  acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AlertResponseDto> {
    return this.acknowledgeAlertUseCase.execute(id, user.userId, true);
  }

  @Post(':id/unacknowledge')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove the acknowledgement of an open alert' })
  @ApiResponse({ status: 200, type: AlertResponseDto })
  @ApiResponse({ status: 403, description: 'No permission on the resource' })
  @ApiResponse({ status: 409, description: 'Alert already resolved' })
  unacknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AlertResponseDto> {
    return this.acknowledgeAlertUseCase.execute(id, user.userId, false);
  }
}
