import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';

/**
 * Retrieves details of a specific role by its unique identifier.
 *
 * Responsibilities:
 * - Fetch the role entity from the repository via RoleDomainService.
 * - Map the domain entity to RoleDto for controller consumption.
 *
 * @param id  The UUID of the role to retrieve.
 * @returns   Promise<RoleDto> containing role name, permissions, and metadata.
 *
 * @throws NotFoundException if no role exists with the given id.
 *
 * @example
 * const role = await getRoleByIdUseCase.execute('role-uuid-123');
 */

@Injectable()
export class GetRoleByIdUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findOneByField({
      field: 'id',
      value: id,
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
    return new RoleResponseDto(role);
  }
}
