import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common/pipes/parse-uuid.pipe';
import { GetUserByIdUseCase } from '@/modules/users/application/use-cases';
import { PresenceService } from '../services/presence.service';
@ApiTags('Presence')
@Controller('presence')
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

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
