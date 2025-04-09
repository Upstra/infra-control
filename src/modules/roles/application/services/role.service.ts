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
import { PermissionDomainServerService } from '@/modules/permissions/domain/services/permission.domain.server.service';
import { PermissionDomainVmService } from '@/modules/permissions/domain/services/permission.domain.VM.service';

@Injectable()
export class RoleService implements RoleEndpointInterface {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly permissionServerDomain: PermissionDomainServerService,
    private readonly permissionVmDomain: PermissionDomainVmService,
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
      // Étape 1 : Crée un rôle vide (ADMIN) pour avoir un ID
      const adminRole = await this.roleRepository.createRole('ADMIN');

      // Étape 2 : Génère les permissions en injectant le roleId
      const permServer =
        this.permissionServerDomain.createFullPermissionEntity();
      permServer.roleId = adminRole.id;

      const permVm = this.permissionVmDomain.createFullPermissionEntity();
      permVm.roleId = adminRole.id;

      // Étape 3 : Attache les permissions à l'entité Role
      adminRole.permissionServers = [permServer];
      adminRole.permissionVms = [permVm];

      // Étape 4 : Save final avec cascade
      return this.roleRepository.save(adminRole);
    }

    try {
      const guest = await this.roleRepository.findByName('GUEST');
      return guest;
    } catch (error) {
      if (error instanceof RoleNotFoundException) {
        const guestRole = await this.roleRepository.createRole('GUEST');

        const permServer =
          this.permissionServerDomain.createReadOnlyPermissionEntity();
        permServer.roleId = guestRole.id;

        const permVm = this.permissionVmDomain.createReadOnlyPermissionEntity();
        permVm.roleId = guestRole.id;

        guestRole.permissionServers = [permServer];
        guestRole.permissionVms = [permVm];

        return this.roleRepository.save(guestRole);
      }
      throw error; // Si c'est une autre erreur, on la relance
    }
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
