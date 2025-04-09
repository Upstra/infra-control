import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { GroupVmDto } from '../dto/group.vm.dto';
import { GroupVmService } from '../services/group.vm.service';
import { GroupController } from '../interfaces/group.controller';

@ApiTags('Group VM')
@Controller('group/vm')
export class GroupVmController extends GroupController<GroupVmDto> {
  constructor(protected readonly groupService: GroupVmService) {
    super(groupService);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes VM' })
  @ApiResponse({ status: 200, type: [GroupVmDto] })
  override async getAllGroups(): Promise<GroupVmDto[]> {
    return super.getAllGroups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe VM par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupVmDto })
  override async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupVmDto> {
    return super.getGroupById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un groupe VM' })
  @ApiBody({ type: GroupVmDto })
  @ApiResponse({ status: 201, type: GroupVmDto })
  override async createGroup(
    @Body() groupDto: GroupVmDto,
  ): Promise<GroupVmDto> {
    return super.createGroup(groupDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe VM' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: GroupVmDto })
  @ApiResponse({ status: 200, type: GroupVmDto })
  override async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() groupDto: GroupVmDto,
  ): Promise<GroupVmDto> {
    return super.updateGroup(id, groupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un groupe VM' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Groupe supprimé avec succès' })
  override async deleteGroup(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return super.deleteGroup(id);
  }
}
