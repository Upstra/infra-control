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
  Req,
  UseFilters,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from '../../../../core/guards/role.guard';

import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
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
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { ImportSettingsData } from '../use-cases/import-settings.use-case';
import { SystemSettingsExceptionFilter } from '../filters/system-settings-exception.filter';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRole({ isAdmin: true })
@UseFilters(SystemSettingsExceptionFilter)
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'System settings not found',
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid settings data',
  })
  async updateSettings(
    @Body() updateDto: UpdateSystemSettingsDto,
    @CurrentUser() payload: JwtPayload,
    @Req() req: Request,
  ): Promise<SystemSettingsResponseDto> {
    return await this.updateSystemSettingsUseCase.execute(
      updateDto,
      payload.userId,
      req.ip,
      req.get('user-agent'),
    );
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid settings category',
  })
  async resetCategory(
    @Param('category') category: string,
    @CurrentUser() payload: JwtPayload,
    @Req() req: Request,
  ): Promise<SystemSettingsResponseDto> {
    return await this.resetSettingsCategoryUseCase.execute(
      category,
      payload.userId,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post('email/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test email configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test email sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email configuration error',
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Settings import failed',
  })
  async importSettings(
    @Body() importDto: ImportSettingsDto,
    @CurrentUser() payload: JwtPayload,
    @Req() req: Request,
  ): Promise<SystemSettingsResponseDto> {
    return await this.importSettingsUseCase.execute(
      importDto as ImportSettingsData,
      payload.userId,
      req.ip,
      req.get('user-agent'),
    );
  }
}
