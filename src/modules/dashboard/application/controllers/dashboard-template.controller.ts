import {
  Controller,
  Get,
  Post,
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
import { User } from '../../../users/domain/entities/user.entity';
import {
  DashboardTemplateListResponseDto,
  CreateLayoutFromTemplateDto,
} from '../dto/dashboard-template.dto';
import { DashboardLayoutResponseDto } from '../dto/dashboard-layout.dto';
import {
  ListTemplatesUseCase,
  CreateLayoutFromTemplateUseCase,
} from '../use-cases/templates';

@ApiTags('Dashboard Templates')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardTemplateController {
  constructor(
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly createLayoutFromTemplateUseCase: CreateLayoutFromTemplateUseCase,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get available dashboard templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of dashboard templates',
    type: DashboardTemplateListResponseDto,
  })
  async getTemplates(): Promise<DashboardTemplateListResponseDto> {
    return this.listTemplatesUseCase.execute();
  }

  @Post('layouts/from-template')
  @ApiOperation({ summary: 'Create a new layout from a template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Layout created from template',
    type: DashboardLayoutResponseDto,
  })
  async createLayoutFromTemplate(
    @CurrentUser() user: User,
    @Body() dto: CreateLayoutFromTemplateDto,
  ): Promise<DashboardLayoutResponseDto> {
    return this.createLayoutFromTemplateUseCase.execute(user.id, dto);
  }
}
