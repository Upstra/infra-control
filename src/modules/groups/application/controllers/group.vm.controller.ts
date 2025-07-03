import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { CreateGroupVmUseCase } from '../use-cases/group-vm/create-group-vm.use-case';
import { GetAllGroupVmUseCase } from '../use-cases/group-vm/get-all-group-vm.use-case';
import { UpdateGroupVmUseCase } from '../use-cases/group-vm/update-group-vm.use-case';
import { DeleteGroupVmUseCase } from '../use-cases/group-vm/delete-group-vm.use-case';
import { GroupVmDto } from '../dto/group.vm.dto';
import { GroupVmResponseDto } from '../dto/group.vm.response.dto';
import { GroupVmListResponseDto } from '../dto/group.vm.list.response.dto';
import { GetGroupVmByIdUseCase } from '../use-cases/group-vm/get-group-vm-by-id.use-case';

@ApiTags('Group VM')
@Controller('group/vm')
export class GroupVmController {
  constructor(
    private readonly createGroupVm: CreateGroupVmUseCase,
    private readonly getAllGroupsVm: GetAllGroupVmUseCase,
    private readonly getGroupVmById: GetGroupVmByIdUseCase,
    private readonly updateGroupVm: UpdateGroupVmUseCase,
    private readonly deleteGroupVm: DeleteGroupVmUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes VM avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: GroupVmListResponseDto })
  async getAllGroups(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<GroupVmListResponseDto> {
    return this.getAllGroupsVm.execute(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe VM par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupVmDto })
  async getGroupById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupVmDto> {
    return this.getGroupVmById.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un groupe VM' })
  @ApiBody({ type: GroupVmDto })
  @ApiResponse({ status: 201, type: GroupVmDto })
  async createGroup(@Body() dto: GroupVmDto): Promise<GroupVmDto> {
    return this.createGroupVm.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe VM' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: GroupVmDto })
  @ApiResponse({ status: 200, type: GroupVmDto })
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GroupVmDto,
  ): Promise<GroupVmDto> {
    return this.updateGroupVm.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un groupe VM' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Groupe supprimé avec succès' })
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteGroupVm.execute(id);
  }
}
