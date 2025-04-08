import { Injectable, Inject } from '@nestjs/common';
import { RoleRepositoryInterface } from '../domain/interfaces/role.repository.interface';
import { RoleDto } from './dto/role.dto';
import { Role } from '../domain/entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) { }

  async getAllRoles(): Promise<RoleDto[]> {
    return null;
  }

  async getRawByName(name: string): Promise<Role> {
    return this.roleRepository.findByName(name);
  }


  async getRoleById(id: string): Promise<RoleDto> {
    return null;
  }

  async createRole(roleDto: RoleDto): Promise<RoleDto> {
    return null;
  }

  async updateRole(id: string, roleDto: RoleDto): Promise<RoleDto> {
    return null;
  }

  async deleteRole(id: string): Promise<void> {
    return null;
  }
}
