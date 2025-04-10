import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  forwardRef,
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
      const adminRole = await this.roleRepository.createRole('ADMIN');
      adminRole.canCreateServer = true;
      return this.roleRepository.save(adminRole);
    }

    if (noUsersExist) {
      try {
        const existingAdmin = await this.roleRepository.findByName('ADMIN');
        existingAdmin.canCreateServer = true;
        return this.roleRepository.save(existingAdmin);
      } catch (error) {
        throw error;
      }
    }

    try {
      const guest = await this.roleRepository.findByName('GUEST');
      return guest;
    } catch (error) {
      if (error instanceof RoleNotFoundException) {
        const guestRole = await this.roleRepository.createRole('GUEST');
        return this.roleRepository.save(guestRole);
      }
      throw error;
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
