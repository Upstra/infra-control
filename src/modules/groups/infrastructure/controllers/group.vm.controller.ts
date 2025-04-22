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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CreateGroupVmUseCase } from '../../application/use-cases/group-vm/create-group-vm.use-case';
import { GetAllGroupVmUseCase } from '../../application/use-cases/group-vm/get-all-group-vm.use-case';
import { UpdateGroupVmUseCase } from '../../application/use-cases/group-vm/update-group-vm.use-case';
import { DeleteGroupVmUseCase } from '../../application/use-cases/group-vm/delete-group-vm.use-case';
import { GroupVmDto } from '../../application/dto/group.vm.dto';
import { GetGroupVmByIdUseCase } from '../../application/use-cases/group-vm/get-group-vm-by-id.use-case';

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
  @ApiOperation({ summary: 'Récupérer tous les groupes VM' })
  @ApiResponse({ status: 200, type: [GroupVmDto] })
  async getAllGroups(): Promise<GroupVmDto[]> {
    return this.getAllGroupsVm.execute();
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
