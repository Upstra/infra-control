import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleEndpointInterface } from '@/modules/roles/application/interfaces/role.endpoint.interface';
import { RoleCreationDto } from '@/modules/roles/application/dto/role.creation.dto';

@Controller('role')
export class RoleController implements RoleEndpointInterface {
  constructor(private readonly roleService: RoleService) {}
  @Get()
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return this.roleService.getAllRoles();
  }

  @Get(':id')
  async getRoleById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleResponseDto> {
    return this.roleService.getRoleById(id);
  }

  @Post()
  async createRole(@Body() roleDto: RoleCreationDto): Promise<RoleResponseDto> {
    return this.roleService.createRole(roleDto);
  }

  @Patch(':id')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleDto: RoleCreationDto,
  ): Promise<RoleResponseDto> {
    return this.roleService.updateRole(id, roleDto);
  }

  @Delete(':id')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roleService.deleteRole(id);
  }
}
