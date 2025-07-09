import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { User } from '@/modules/users/domain/entities/user.entity';
import { UserPreferencesResponseDto } from '../dto/user-preferences-response.dto';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import {
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
  ResetUserPreferencesUseCase,
} from '../use-cases';

@ApiTags('User Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/preferences')
export class UserPreferencesController {
  constructor(
    private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
    private readonly updateUserPreferencesUseCase: UpdateUserPreferencesUseCase,
    private readonly resetUserPreferencesUseCase: ResetUserPreferencesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully',
    type: UserPreferencesResponseDto,
  })
  async getPreferences(
    @CurrentUser() user: User,
  ): Promise<UserPreferencesResponseDto> {
    const preferences = await this.getUserPreferencesUseCase.execute(user.id);
    return this.toResponseDto(preferences);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences updated successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const preferences = await this.updateUserPreferencesUseCase.execute(
      user.id,
      updateDto,
    );
    return this.toResponseDto(preferences);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user preferences to default values' })
  @ApiResponse({
    status: 200,
    description: 'User preferences reset successfully',
    type: UserPreferencesResponseDto,
  })
  async resetPreferences(
    @CurrentUser() user: User,
  ): Promise<UserPreferencesResponseDto> {
    const preferences = await this.resetUserPreferencesUseCase.execute(user.id);
    return this.toResponseDto(preferences);
  }

  private toResponseDto(entity: any): UserPreferencesResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      locale: entity.locale,
      theme: entity.theme,
      timezone: entity.timezone,
      notifications: entity.notifications,
      display: entity.display,
      integrations: entity.integrations,
      performance: entity.performance,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}