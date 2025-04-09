import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleEndpointInterface } from '@/modules/roles/application/interfaces/role.endpoint.interface';
import { RoleNotFoundException } from '@/modules/roles/domain/exceptions/role.exception';
import { RoleCreationDto } from '@/modules/roles/application/dto/role.creation.dto';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionServerService } from '@/modules/permissions/application/services/permission.server.service';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { RoleDomainService } from '../../domain/services/role.domain.service';
import { PermissionServerDto } from '@/modules/permissions/application/dto/permission.server.dto';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionVmService } from '@/modules/permissions/application/services/permission.vm.service';

@Injectable()
export class RoleService implements RoleEndpointInterface {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly permissionServerService: PermissionServerService,
    private readonly permissionVmService: PermissionVmService,
    private readonly roleDomain: RoleDomainService,
  ) {}

  async getAllRoles(): Promise<RoleResponseDto[]> {
    try {
      const roles = await this.roleRepository.findAll();
      return roles.map((role) => new RoleResponseDto(role));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getRawByName(name: string): Promise<Role> {
    return this.roleRepository.findByName(name);
  }

  async getRoleById(id: string): Promise<RoleResponseDto> {
    try {
      const role = await this.roleRepository.findRoleById(id);
      return new RoleResponseDto(role);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createRole(roleDto: RoleCreationDto): Promise<RoleResponseDto> {
    try {
      const role = await this.roleRepository.createRole(roleDto.name);
      return new RoleResponseDto(role);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateRole(
    id: string,
    roleDto: RoleCreationDto,
  ): Promise<RoleResponseDto> {
    try {
      const role = await this.roleRepository.updateRole(id, roleDto.name);
      return new RoleResponseDto(role);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      await this.roleRepository.deleteRole(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async ensureDefaultRole(): Promise<Role> {
    const roles = await this.roleRepository.findAll();

    if (roles.length === 0) {
      const permServer: PermissionServer =
        await this.permissionServerService.createFullPermission();
      const permVm: PermissionVm =
        await this.permissionVmService.createFullPermission();

      const adminRole = this.roleDomain.createAdminRoleEntity(
        permServer,
        permVm,
      );
      return this.roleRepository.save(adminRole);
    }

    const guest = await this.roleRepository.findByName('GUEST');
    if (guest) return guest;

    const permServer: PermissionServer =
      await this.permissionServerService.createReadOnlyPermission();
    const permVm: PermissionVm =
      await this.permissionVmService.createReadOnlyPermission();
    const guestRole = this.roleDomain.createGuestRole(permServer, permVm);
    return this.roleRepository.save(guestRole);
  }

  private handleError(error: any): void {
    if (error instanceof RoleNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
