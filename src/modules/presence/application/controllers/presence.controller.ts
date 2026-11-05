import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { GetUserByIdUseCase } from '@/modules/users/application/use-cases';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { PresenceService } from '../services/presence.service';
import { PresenceDomainService } from '../../domain/services/presence.domain.service';
import { PresenceViewDto } from '../dto/presence-view.dto';

@ApiTags('Presence')
@Controller('presence')
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly presenceDomain: PresenceDomainService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Utilisateurs connectés avec leur statut et la page consultée',
  })
  @ApiResponse({ status: 200, type: [PresenceViewDto] })
  async listOnline(
    @CurrentUser() user: JwtPayload,
  ): Promise<PresenceViewDto[]> {
    const showActivity = this.presenceDomain.canSeeActivity({
      userId: user?.userId,
      isActive: user?.isActive,
    });
    const online = await this.presenceService.listOnline();
    return online.map(({ userId, record }) =>
      this.presenceDomain.toView(userId, record, showActivity),
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Vérifie si un utilisateur est en ligne' })
  @ApiParam({
    name: 'userId',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: "UUID de l'utilisateur à vérifier",
  })
  @ApiResponse({ status: 200, description: 'Statut de présence retourné' })
  async isUserOnline(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ online: boolean }> {
    await this.getUserByIdUseCase.execute(userId);
    return { online: await this.presenceService.isOnline(userId) };
  }
}
