import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PermissionEndpointInterface } from '../interfaces/permission.endpoint.interface';
import { PermissionVmDto } from '../dto/permission.vm.dto';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';

@Injectable()
export class PermissionVmService implements PermissionEndpointInterface {
  constructor(private readonly permissionRepository: PermissionVmRepository) {}

  async getPermissionsByRole(roleId: string): Promise<PermissionVmDto[]> {
    try {
      const permissions = await this.permissionRepository.findAllByRole(roleId);
      return permissions.map((permission) => new PermissionVmDto(permission));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getPermissionByIds(
    vmId: string,
    roleId: string,
  ): Promise<PermissionVmDto> {
    try {
      const permission = await this.permissionRepository.findPermissionByIds(
        vmId,
        roleId,
      );
      return new PermissionVmDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createPermission(
    permissionDto: PermissionVmDto,
  ): Promise<PermissionVmDto> {
    try {
      const permission = await this.permissionRepository.createPermission(
        permissionDto.vmId,
        permissionDto.roleId,
        permissionDto.allowWrite,
        permissionDto.allowRead,
      );
      return new PermissionVmDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updatePermission(
    vmId: string,
    roleId: string,
    permissionDto: PermissionVmDto,
  ): Promise<PermissionVmDto> {
    try {
      const permission = await this.permissionRepository.updatePermission(
        vmId,
        roleId,
        permissionDto.allowWrite,
        permissionDto.allowRead,
      );
      return new PermissionVmDto(permission);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deletePermission(machineId: string, roleId: string): Promise<void> {
    try {
      await this.permissionRepository.deletePermission(machineId, roleId);
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
