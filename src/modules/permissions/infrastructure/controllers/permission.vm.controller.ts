import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  CreatePermissionVmUseCase,
  GetPermissionsVmByRoleUseCase,
  GetPermissionVmByIdsUseCase,
  UpdatePermissionVmUseCase,
} from '../../application/use-cases/permission-vm';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionVmDto } from '../../application/dto/permission.vm.dto';

@ApiTags('Permission - VM')
@Controller('permission/vm')
export class PermissionVmController {
  constructor(
    private readonly createUseCase: CreatePermissionVmUseCase,
    private readonly updateUseCase: UpdatePermissionVmUseCase,
    private readonly getByIdsUseCase: GetPermissionVmByIdsUseCase,
    private readonly getByRoleUseCase: GetPermissionsVmByRoleUseCase,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Créer une permission VM' })
  @ApiResponse({ status: 201, description: 'Permission créée.' })
  create(@Body() dto: PermissionVmDto): Promise<PermissionVmDto> {
    return this.createUseCase.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une permission VM' })
  @ApiResponse({ status: 200, description: 'Permission mise à jour.' })
  update(@Body() dto: PermissionVmDto): Promise<PermissionVmDto> {
    return this.updateUseCase.execute(dto);
  }

  @Get('by-ids')
  @ApiOperation({ summary: 'Récupérer des permissions VM par IDs' })
  @ApiQuery({
    name: 'ids',
    type: [String],
    required: true,
    description: 'Liste des IDs',
  })
  @ApiResponse({ status: 200, description: 'Permissions récupérées.' })
  getByIds(@Body() dto: PermissionVmDto): Promise<PermissionVmDto> {
    return this.getByIdsUseCase.execute(dto);
  }

  @Get('by-role/:role')
  @ApiOperation({ summary: 'Récupérer les permissions VM par rôle' })
  @ApiResponse({
    status: 200,
    description: 'Permissions trouvées pour le rôle donné.',
  })
  getByRole(@Param('role') role: string): Promise<PermissionVmDto[]> {
    return this.getByRoleUseCase.execute(role);
  }
}
