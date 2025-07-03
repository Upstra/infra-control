import { Controller, Body, Post, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { ShutdownRequestDto } from '../dto/shutdown-request.dto';
import { ShutdownPreviewListResponseDto } from '../dto/shutdown-preview.list.response.dto';
import { PreviewShutdownUseCase } from '../use-cases/preview-shutdown.use-case';
import { ExecuteShutdownUseCase } from '../use-cases/execute-shutdown.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';

@ApiTags('Group Shutdown')
@Controller('group/shutdown')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupShutdownController {
  constructor(
    private readonly previewShutdown: PreviewShutdownUseCase,
    private readonly executeShutdown: ExecuteShutdownUseCase,
  ) {}

  @Post('preview')
  @ApiOperation({
    summary: 'Preview shutdown sequence for groups',
    description:
      'Returns the order in which VMs and servers would be shut down',
  })
  @ApiBody({ type: ShutdownRequestDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ShutdownPreviewListResponseDto })
  async preview(
    @Body() dto: ShutdownRequestDto,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ShutdownPreviewListResponseDto> {
    return this.previewShutdown.execute(dto.groupIds, Number(page), Number(limit));
  }

  @Post('execute')
  @UseGuards(RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiOperation({
    summary: 'Execute shutdown sequence for groups',
    description:
      'Actually performs the shutdown of VMs and servers in the correct order',
  })
  @ApiBody({ type: ShutdownRequestDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ShutdownPreviewListResponseDto })
  async execute(
    @Body() dto: ShutdownRequestDto,
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ShutdownPreviewListResponseDto> {
    return this.executeShutdown.execute(dto.groupIds, user.userId, Number(page), Number(limit));
  }
}
