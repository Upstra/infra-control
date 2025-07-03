import { Controller, Body, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ShutdownRequestDto } from '../dto/shutdown-request.dto';
import { ShutdownPreviewResponseDto } from '../dto/shutdown-preview.response.dto';
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
  @ApiResponse({ status: 200, type: ShutdownPreviewResponseDto })
  async preview(
    @Body() dto: ShutdownRequestDto,
  ): Promise<ShutdownPreviewResponseDto> {
    return this.previewShutdown.execute(dto.groupIds);
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
  @ApiResponse({ status: 200, type: ShutdownPreviewResponseDto })
  async execute(
    @Body() dto: ShutdownRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ShutdownPreviewResponseDto> {
    return this.executeShutdown.execute(dto.groupIds, user.userId);
  }
}
