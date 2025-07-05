import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { PreviewGroupShutdownUseCase } from '../use-cases/preview-group-shutdown.use-case';
import { ExecuteGroupShutdownUseCase } from '../use-cases/execute-group-shutdown.use-case';
import { GroupShutdownDto } from '../dto/group-shutdown.dto';
import { PreviewShutdownResponseDto } from '../dto/preview-shutdown-response.dto';

@ApiTags('groups')
@Controller('groups/:id/shutdown')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupShutdownController {
  constructor(
    private readonly previewGroupShutdownUseCase: PreviewGroupShutdownUseCase,
    private readonly executeGroupShutdownUseCase: ExecuteGroupShutdownUseCase,
  ) {}

  @Get('preview')
  @ApiOperation({
    summary: 'Preview shutdown order for a group based on VM/Server priorities',
  })
  async previewShutdown(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PreviewShutdownResponseDto> {
    return this.previewGroupShutdownUseCase.execute(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Execute shutdown for a group based on VM/Server priorities',
  })
  async executeShutdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GroupShutdownDto,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.executeGroupShutdownUseCase.execute(id, dto, user.id);
  }
}
