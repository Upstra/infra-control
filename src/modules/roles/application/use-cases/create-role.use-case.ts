import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto, RoleResponseDto } from '../dto';

/**
 * Creates a new user role with specified permissions.
 *
 * Responsibilities:
 * - Validate the CreateRoleDto (unique name, valid permission set).
 * - Invoke RoleDomainService to persist the new role.
 * - Return the created RoleDto with generated identifier.
 *
 * @param dto  CreateRoleDto containing role name and associated permissions.
 * @returns    Promise<RoleDto> of the newly created role.
 *
 * @throws ValidationException if name is duplicate or permissions invalid.
 *
 * @example
 * const newRole = await createRoleUseCase.execute({ name: 'tech', permissions: [...] });
 */

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(dto: RoleCreationDto): Promise<RoleResponseDto> {
    const role = await this.roleRepository.createRole(dto.name);
    return new RoleResponseDto(role);
  }
}
