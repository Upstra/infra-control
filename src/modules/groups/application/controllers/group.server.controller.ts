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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CreateGroupServerUseCase } from '../use-cases/group-server/create-group-server.use-case';
import { GetAllGroupServerUseCase } from '../use-cases/group-server/get-all-group-server.use-case';
import { UpdateGroupServerUseCase } from '../use-cases/group-server/update-group-server.use-case';
import { DeleteGroupServerUseCase } from '../use-cases/group-server/delete-group-server.use-case';
import { GroupServerDto } from '../dto/group.server.dto';
import { GetGroupServerByIdUseCase } from '../use-cases/group-server/get-group-server-by-id.use-case';

@ApiTags('Group Server')
@Controller('group/server')
export class GroupServerController {
  constructor(
    private readonly createGroupServer: CreateGroupServerUseCase,
    private readonly getAllGroupsServer: GetAllGroupServerUseCase,
    private readonly getGroupServerById: GetGroupServerByIdUseCase,
    private readonly updateGroupServer: UpdateGroupServerUseCase,
    private readonly deleteGroupServer: DeleteGroupServerUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes de serveurs' })
  @ApiResponse({ status: 200, type: [GroupServerDto] })
  async getAllGroups(): Promise<GroupServerDto[]> {
    return this.getAllGroupsServer.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe serveur par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupServerDto })
  async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupServerDto> {
    return this.getGroupServerById.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau groupe serveur' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 201, type: GroupServerDto })
  async createGroup(@Body() dto: GroupServerDto): Promise<GroupServerDto> {
    return this.createGroupServer.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 200, type: GroupServerDto })
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GroupServerDto,
  ): Promise<GroupServerDto> {
    return this.updateGroupServer.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Groupe supprimé avec succès' })
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteGroupServer.execute(id);
  }
}
