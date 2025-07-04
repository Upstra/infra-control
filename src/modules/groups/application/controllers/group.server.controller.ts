import {
  Controller,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateGroupServerUseCase } from '../use-cases/group-server/create-group-server.use-case';
import { GetAllGroupServerUseCase } from '../use-cases/group-server/get-all-group-server.use-case';
import { UpdateGroupServerUseCase } from '../use-cases/group-server/update-group-server.use-case';
import { DeleteGroupServerUseCase } from '../use-cases/group-server/delete-group-server.use-case';
import { GroupServerDto } from '../dto/group.server.dto';
import { GroupServerResponseDto } from '../dto/group.server.response.dto';
import { GroupServerListResponseDto } from '../dto/group.server.list.response.dto';
import { GetGroupServerByIdUseCase } from '../use-cases/group-server/get-group-server-by-id.use-case';
import { ToggleCascadeDto } from '../dto/toggle-cascade.dto';
import { ToggleCascadeUseCase } from '../use-cases/toggle-cascade.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@ApiTags('Group Server')
@Controller('group/server')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupServerController {
  constructor(
    private readonly createGroupServer: CreateGroupServerUseCase,
    private readonly getAllGroupsServer: GetAllGroupServerUseCase,
    private readonly getGroupServerById: GetGroupServerByIdUseCase,
    private readonly updateGroupServer: UpdateGroupServerUseCase,
    private readonly deleteGroupServer: DeleteGroupServerUseCase,
    private readonly toggleCascade: ToggleCascadeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les groupes de serveurs avec pagination',
  })
  @ApiQuery({ name: 'roomId', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: GroupServerListResponseDto })
  async getAllGroups(
    @Query('roomId') roomId?: string,
    @Query('priority', new ParseIntPipe({ optional: true })) priority?: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<GroupServerListResponseDto> {
    return this.getAllGroupsServer.execute(
      roomId,
      priority,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe serveur par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupServerResponseDto })
  async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupServerResponseDto> {
    return this.getGroupServerById.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau groupe serveur' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 201, type: GroupServerResponseDto })
  async createGroup(
    @Body() dto: GroupServerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupServerResponseDto> {
    return this.createGroupServer.execute(dto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 200, type: GroupServerResponseDto })
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GroupServerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupServerResponseDto> {
    return this.updateGroupServer.execute(id, dto, user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Groupe supprimé avec succès' })
  async deleteGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deleteGroupServer.execute(id, user.userId);
  }

  @Patch(':id/cascade')
  @ApiOperation({ summary: 'Activer/désactiver cascade sur un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: ToggleCascadeDto })
  @ApiResponse({ status: 200, type: GroupServerResponseDto })
  async toggleGroupCascade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleCascadeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<GroupServerResponseDto> {
    return this.toggleCascade.execute('server', id, dto.cascade, user.userId);
  }
}
