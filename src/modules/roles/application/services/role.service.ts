import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleEndpointInterface } from '../interfaces/role.endpoint.interface';
import { RoleNotFoundException } from '../../domain/exceptions/role.exception';
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
    const [roles, userCount] = await Promise.all([
      this.roleRepository.findAll(),
      this.userService.getUserCount(),
    ]);

    const noRolesExist = roles.length === 0;
    const noUsersExist = userCount === 0;

    if (noRolesExist && noUsersExist) {
      this.logger.warn(
        'Aucun rôle et aucun utilisateur trouvés. Création du rôle ADMIN par défaut...',
      );
      const adminRole = await this.roleRepository.createRole('ADMIN');
      adminRole.canCreateServer = true;
      return this.roleRepository.save(adminRole);
    }

    if (noUsersExist) {
      try {
        const existingAdmin = await this.roleRepository.findByName('ADMIN');
        if (!existingAdmin.canCreateServer) {
          this.logger.warn(
            'ADMIN existe mais n’a pas les droits pour créer un serveur. Mise à jour...',
          );
          existingAdmin.canCreateServer = true;
          return this.roleRepository.save(existingAdmin);
        }
        return existingAdmin;
      } catch (error) {
        this.logger.error(
          'Impossible de trouver ADMIN alors qu’il n’y a pas encore d’utilisateurs.',
          error,
        );
        const fallbackAdmin = await this.roleRepository.createRole('ADMIN');
        fallbackAdmin.canCreateServer = true;
        return this.roleRepository.save(fallbackAdmin);
      }
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
