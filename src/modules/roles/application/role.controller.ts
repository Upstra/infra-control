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
import { RoleService } from './role.service';
import { RoleDto } from './dto/role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async getAllRoles(): Promise<RoleDto[]> {
    return this.roleService.getAllRoles();
  }

  @Get(':id')
  async getRoleById(@Param('id', ParseUUIDPipe) id: string): Promise<RoleDto> {
    return this.roleService.getRoleById(id);
  }

  @Post()
  async createRole(@Body() roleDto: RoleDto): Promise<RoleDto> {
    return this.roleService.createRole(roleDto);
  }

  @Patch(':id')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roleDto: RoleDto,
  ): Promise<RoleDto> {
    return this.roleService.updateRole(id, roleDto);
  }

  @Delete(':id')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roleService.deleteRole(id);
  }
}
