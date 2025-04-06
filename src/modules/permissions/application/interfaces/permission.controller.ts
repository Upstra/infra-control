import { PermissionServiceInterface } from './permission.service.interface';
import { PermissionDtoInterface } from './permission.dto.interface';
import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';

export abstract class PermissionController {
  protected constructor(
    protected readonly permissionService: PermissionServiceInterface,
  ) {}

  @Get()
  async getAllPermissions(): Promise<PermissionDtoInterface[]> {
    return this.permissionService.getAllPermissions();
  }

  @Get(':id')
  async getPermissionById(
    @Param('id') id: string,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.getPermissionById(id);
  }

  @Post()
  async createPermission(
    @Body() permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.createPermission(permissionDto);
  }

  @Patch(':id')
  async updatePermission(
    @Param('id') id: string,
    @Body() permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.updatePermission(id, permissionDto);
  }

  @Delete(':id')
  async deletePermission(@Param('id') id: string): Promise<void> {
    return this.permissionService.deletePermission(id);
  }
}
