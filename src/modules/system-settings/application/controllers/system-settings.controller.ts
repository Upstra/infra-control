import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RoleGuard } from '../../../../core/guards/role.guard';
import { RequireRole } from '../../../../core/decorators/require-role.decorator';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { User } from '../../../users/domain/entities/user.entity';
import { GetSystemSettingsUseCase } from '../use-cases/get-system-settings.use-case';
import { UpdateSystemSettingsUseCase } from '../use-cases/update-system-settings.use-case';
import { ResetSettingsCategoryUseCase } from '../use-cases/reset-settings-category.use-case';
import { TestEmailConfigurationUseCase } from '../use-cases/test-email-configuration.use-case';
import { ExportSettingsUseCase } from '../use-cases/export-settings.use-case';
import { ImportSettingsUseCase } from '../use-cases/import-settings.use-case';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';
import { TestEmailDto } from '../dto/test-email.dto';
import { ImportSettingsDto } from '../dto/import-settings.dto';
import {
  SystemSettingsResponseDto,
  ExportSettingsResponseDto,
} from '../dto/system-settings-response.dto';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRole('admin')
export class SystemSettingsController {
  constructor(
    private readonly getSystemSettingsUseCase: GetSystemSettingsUseCase,
    private readonly updateSystemSettingsUseCase: UpdateSystemSettingsUseCase,
    private readonly resetSettingsCategoryUseCase: ResetSettingsCategoryUseCase,
    private readonly testEmailConfigurationUseCase: TestEmailConfigurationUseCase,
    private readonly exportSettingsUseCase: ExportSettingsUseCase,
    private readonly importSettingsUseCase: ImportSettingsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System settings retrieved successfully',
    type: SystemSettingsResponseDto,
  })
  async getSettings(): Promise<SystemSettingsResponseDto> {
    return await this.getSystemSettingsUseCase.execute();
  }

  @Patch()
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System settings updated successfully',
    type: SystemSettingsResponseDto,
  })
  async updateSettings(
    @Body() updateDto: UpdateSystemSettingsDto,
    @CurrentUser() user: User,
  ): Promise<SystemSettingsResponseDto> {
    return await this.updateSystemSettingsUseCase.execute(updateDto, user.id);
  }

  @Post(':category/reset')
  @ApiOperation({ summary: 'Reset settings category to defaults' })
  @ApiParam({
    name: 'category',
    enum: ['security', 'system', 'email', 'backup', 'logging'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings category reset successfully',
    type: SystemSettingsResponseDto,
  })
  async resetCategory(
    @Param('category') category: string,
    @CurrentUser() user: User,
  ): Promise<SystemSettingsResponseDto> {
    return await this.resetSettingsCategoryUseCase.execute(category, user.id);
  }

  @Post('email/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test email configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test email sent successfully',
  })
  async testEmail(@Body() testEmailDto: TestEmailDto): Promise<void> {
    await this.testEmailConfigurationUseCase.execute(testEmailDto.to);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export system settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings exported successfully',
    type: ExportSettingsResponseDto,
  })
  async exportSettings(): Promise<ExportSettingsResponseDto> {
    return await this.exportSettingsUseCase.execute();
  }

  @Post('import')
  @ApiOperation({ summary: 'Import system settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings imported successfully',
    type: SystemSettingsResponseDto,
  })
  async importSettings(
    @Body() importDto: ImportSettingsDto,
    @CurrentUser() user: User,
  ): Promise<SystemSettingsResponseDto> {
    return await this.importSettingsUseCase.execute(importDto, user.id);
  }
}