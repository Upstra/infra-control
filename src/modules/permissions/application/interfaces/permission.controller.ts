import { PermissionEndpointInterface } from './permission.endpoint.interface';
import { PermissionDtoInterface } from './permission.dto.interface';
import {
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

export abstract class PermissionController
  implements PermissionEndpointInterface
{
  protected constructor(
    protected readonly permissionService: PermissionEndpointInterface,
  ) {}

  @Get('role/:roleId')
  async getPermissionsByRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<PermissionDtoInterface[]> {
    return this.permissionService.getPermissionsByRole(roleId);
  }

  @Get(':machineId/role/:roleId')
  async getPermissionByIds(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Param('machineId', ParseUUIDPipe) machineId: string,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.getPermissionByIds(machineId, roleId);
  }

  @Post()
  async createPermission(
    @Body() permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.createPermission(permissionDto);
  }

  @Patch(':machineId/role/:roleId')
  async updatePermission(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() permissionDto: PermissionDtoInterface,
  ): Promise<PermissionDtoInterface> {
    return this.permissionService.updatePermission(
      machineId,
      roleId,
      permissionDto,
    );
  }

  @Delete(':machineId/role/:roleId')
  async deletePermission(
    @Param('machineId', ParseUUIDPipe) machineId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    return this.permissionService.deletePermission(machineId, roleId);
  }
}
