import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';

/**
 * Alias for retrieving all roles, including system defaults.
 *
 * Responsibilities:
 * - Delegates to GetRoleListUseCase or directly to RoleDomainService.
 * - Ensures default roles are included (invokes EnsureDefaultRoleUseCase if needed).
 *
 * @returns Promise<RoleDto[]> comprehensive list of role definitions.
 *
 * @example
 * const allRoles = await getAllRolesUseCase.execute();
 */

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}
  async execute(): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository.findAll();
    return roles.map((r) => new RoleResponseDto(r));
  }
}
