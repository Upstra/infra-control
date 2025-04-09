import { Controller, Body, Param, ParseUUIDPipe, Get, Post, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { GroupServerDto } from '../dto/group.server.dto';
import { GroupServerService } from '../services/group.server.service';
import { GroupController } from '../interfaces/group.controller';

@ApiTags('Group Server')
@Controller('group/server')
export class GroupServerController extends GroupController<GroupServerDto> {
  constructor(protected readonly groupService: GroupServerService) {
    super(groupService);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes de serveurs' })
  @ApiResponse({ status: 200, type: [GroupServerDto] })
  override async getAllGroups(): Promise<GroupServerDto[]> {
    return super.getAllGroups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe serveur par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupServerDto })
  override async getGroupById(@Param('id', ParseUUIDPipe) id: string): Promise<GroupServerDto> {
    return super.getGroupById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau groupe serveur' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 201, type: GroupServerDto })
  override async createGroup(@Body() groupDto: GroupServerDto): Promise<GroupServerDto> {
    return super.createGroup(groupDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: GroupServerDto })
  @ApiResponse({ status: 200, type: GroupServerDto })
  override async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() groupDto: GroupServerDto,
  ): Promise<GroupServerDto> {
    return super.updateGroup(id, groupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un groupe serveur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204 })
  override async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return super.deleteGroup(id);
  }
}
