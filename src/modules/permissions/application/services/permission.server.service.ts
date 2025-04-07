import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PermissionEndpointInterface } from '../interfaces/permission.endpoint.interface';
import { PermissionServerDto } from '../dto/permission.server.dto';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionServerRepository } from '@/modules/permissions/infrastructure/repositories/permission.server.repository';

@Injectable()
export class PermissionServerService implements PermissionEndpointInterface {
  constructor(
    private readonly permissionRepository: PermissionServerRepository,
  ) {}

  async getPermissionsByRole(roleId: string): Promise<PermissionServerDto[]> {
    try {
      const permissions = await this.permissionRepository.findAllByRole(roleId);
      return permissions.map(
        (permission) => new PermissionServerDto(permission),
      );
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getPermissionByIds(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServerDto> {
    try {
      const permission = await this.permissionRepository.findPermissionByIds(
        serverId,
        roleId,
      );
      return new PermissionServerDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createPermission(
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    try {
      const permission = await this.permissionRepository.createPermission(
        permissionDto.serverId,
        permissionDto.roleId,
        permissionDto.allowWrite,
        permissionDto.allowRead,
      );
      return new PermissionServerDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updatePermission(
    serverId: string,
    roleId: string,
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    try {
      const permission = await this.permissionRepository.updatePermission(
        serverId,
        roleId,
        permissionDto.allowWrite,
        permissionDto.allowRead,
      );
      return new PermissionServerDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deletePermission(serverId: string, roleId: string): Promise<void> {
    try {
      await this.permissionRepository.deletePermission(serverId, roleId);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof PermissionNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
