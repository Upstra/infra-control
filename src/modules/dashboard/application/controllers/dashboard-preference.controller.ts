import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../../core/types/jwt-payload.interface';
import { DashboardRateLimitGuard } from '../guards/dashboard-rate-limit.guard';
import {
  DashboardPreferenceResponseDto,
  UpdateDashboardPreferenceDto,
} from '../dto/dashboard-preference.dto';
import {
  GetPreferencesUseCase,
  UpdatePreferencesUseCase,
} from '../use-cases/preferences';

@ApiTags('Dashboard Preferences')
@Controller('dashboard/preferences')
@UseGuards(JwtAuthGuard, DashboardRateLimitGuard)
@ApiBearerAuth()
export class DashboardPreferenceController {
  constructor(
    private readonly getPreferencesUseCase: GetPreferencesUseCase,
    private readonly updatePreferencesUseCase: UpdatePreferencesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard preferences for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard preferences',
    type: DashboardPreferenceResponseDto,
  })
  async getPreferences(
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardPreferenceResponseDto> {
    return this.getPreferencesUseCase.execute(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update dashboard preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard preferences updated',
    type: DashboardPreferenceResponseDto,
  })
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateDashboardPreferenceDto,
  ): Promise<DashboardPreferenceResponseDto> {
    return this.updatePreferencesUseCase.execute(user.userId, dto);
  }
}
