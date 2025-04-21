import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleEndpointInterface } from '../interfaces/role.endpoint.interface';
import { RoleCreationDto } from '../dto/role.creation.dto';
import { Role } from '../../domain/entities/role.entity';
import { UserService } from '@/modules/users/application/services/user.service';

@Injectable()
export class RoleService implements RoleEndpointInterface {
  private readonly logger = new Logger(RoleService.name);
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async getAllRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.findAll();
    return roles.map((role) => new RoleResponseDto(role));
  }

  async getRawByName(name: string): Promise<Role> {
    return this.roleRepository.findByName(name);
  }

  async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findRoleById(id);
    return new RoleResponseDto(role);
  }

  async createRole(roleDto: RoleCreationDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.createRole(roleDto.name);
    return new RoleResponseDto(role);
  }

  async updateRole(
    id: string,
    roleDto: RoleCreationDto,
  ): Promise<RoleResponseDto> {
    const role = await this.roleRepository.updateRole(id, roleDto.name);
    return new RoleResponseDto(role);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.deleteRole(id);
  }

  async ensureDefaultRole(): Promise<Role> {
    const [roles, userCount] = await Promise.all([
      this.roleRepository.findAll(),
      this.userService.getUserCount(),
    ]);

    if (this.shouldCreateAdminRole(roles, userCount)) {
      return this.createDefaultAdminRole();
    }

    if (this.shouldUpdateAdminRole(userCount)) {
      return this.ensureAdminHasServerRights();
    }

    return this.ensureGuestRoleExists();
  }

  private shouldCreateAdminRole(roles: Role[], userCount: number): boolean {
    return roles.length === 0 && userCount === 0;
  }

  private shouldUpdateAdminRole(userCount: number): boolean {
    return userCount === 0;
  }

  private async createDefaultAdminRole(): Promise<Role> {
    this.logger.warn('Aucun rôle et utilisateur... création ADMIN');
    const admin = await this.roleRepository.createRole('ADMIN');
    admin.canCreateServer = true;
    return this.roleRepository.save(admin);
  }

  private async ensureAdminHasServerRights(): Promise<Role> {
    try {
      const admin = await this.roleRepository.findByName('ADMIN');
      if (!admin.canCreateServer) {
        this.logger.warn('ADMIN n’a pas les droits, on corrige...');
        admin.canCreateServer = true;
        return this.roleRepository.save(admin);
      }
      return admin;
    } catch (e) {
      this.logger.error('ADMIN introuvable, fallback', e);
      const fallback = await this.roleRepository.createRole('ADMIN');
      fallback.canCreateServer = true;
      return this.roleRepository.save(fallback);
    }
  }

  private async ensureGuestRoleExists(): Promise<Role> {
    const guest = await this.roleRepository.findByName('GUEST');
    if (!guest) {
      this.logger.warn('GUEST inexistant, on le crée...');
      const newGuest = await this.roleRepository.createRole('GUEST');
      return this.roleRepository.save(newGuest);
    }
    return guest;
  }
}
