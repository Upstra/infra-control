import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  HttpCode,
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
  CreateDashboardLayoutDto,
  UpdateDashboardLayoutDto,
  DashboardLayoutResponseDto,
  DashboardLayoutListResponseDto,
} from '../dto/dashboard-layout.dto';
import {
  CreateLayoutUseCase,
  UpdateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
} from '../use-cases/layouts';

@ApiTags('Dashboard Layouts')
@Controller('dashboard/layouts')
@UseGuards(JwtAuthGuard, DashboardRateLimitGuard)
@ApiBearerAuth()
export class DashboardLayoutController {
  constructor(
    private readonly createLayoutUseCase: CreateLayoutUseCase,
    private readonly updateLayoutUseCase: UpdateLayoutUseCase,
    private readonly deleteLayoutUseCase: DeleteLayoutUseCase,
    private readonly getLayoutUseCase: GetLayoutUseCase,
    private readonly listLayoutsUseCase: ListLayoutsUseCase,
    private readonly setDefaultLayoutUseCase: SetDefaultLayoutUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all dashboard layouts for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of dashboard layouts',
    type: DashboardLayoutListResponseDto,
  })
  async getLayouts(
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardLayoutListResponseDto> {
    return this.listLayoutsUseCase.execute(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific dashboard layout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard layout details',
    type: DashboardLayoutResponseDto,
  })
  async getLayout(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DashboardLayoutResponseDto> {
    return this.getLayoutUseCase.execute(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dashboard layout' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dashboard layout created',
    type: DashboardLayoutResponseDto,
  })
  async createLayout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDashboardLayoutDto,
  ): Promise<DashboardLayoutResponseDto> {
    return this.createLayoutUseCase.execute(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing dashboard layout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard layout updated',
    type: DashboardLayoutResponseDto,
  })
  async updateLayout(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDashboardLayoutDto,
  ): Promise<DashboardLayoutResponseDto> {
    return this.updateLayoutUseCase.execute(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a dashboard layout' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Dashboard layout deleted',
  })
  async deleteLayout(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteLayoutUseCase.execute(id, user.userId);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a layout as default for the user' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Default layout set',
  })
  async setDefaultLayout(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.setDefaultLayoutUseCase.execute(id, user.userId);
  }
}
