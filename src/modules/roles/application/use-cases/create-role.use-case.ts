import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleCreationDto, RoleResponseDto } from '../dto';
import { AdminRoleCreationDto } from '../dto/role.creation.dto';
import { RoleDomainService } from '../../domain/services/role.domain.service';
import {
  AdminRoleAlreadyExistsException,
  SystemRoleNameAlreadyExistsException,
} from '../../domain/exceptions/role.exception';

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
    private readonly roleDomainService: RoleDomainService,
  ) {}

  async execute(
    dto: RoleCreationDto | AdminRoleCreationDto,
  ): Promise<RoleResponseDto> {
    const roleName = dto.name.toUpperCase();
    if (roleName === 'ADMIN' || roleName === 'GUEST') {
      throw new SystemRoleNameAlreadyExistsException(roleName);
    }

    if (dto instanceof AdminRoleCreationDto && dto.isAdmin) {
      const existing = await this.roleRepository.findOneByField({
        field: 'isAdmin',
        value: true,
        disableThrow: true,
      });
      if (existing) {
        throw new AdminRoleAlreadyExistsException();
      }
    }
    const entity = this.roleDomainService.toRoleEntity(dto);
    const role = await this.roleRepository.save(entity);
    return new RoleResponseDto(role);
  }
}
