import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { RoleResponseDto } from '../dto/role.response.dto';
import { RoleUpdateDto } from '../dto/role.update.dto';
import { RoleDomainService } from '../../domain/services/role.domain.service';

/**
 * Updates an existing role’s metadata and permission assignments.
 *
 * Responsibilities:
 * - Fetch and validate the target role via RoleDomainService.
 * - Apply changes from UpdateRoleDto (name, permission list).
 * - Persist updates and return the updated RoleDto.
 *
 * @param id   The UUID of the role to update.
 * @param dto  UpdateRoleDto containing new name or permission changes.
 * @returns    Promise<RoleDto> reflecting the updated role.
 *
 * @throws NotFoundException if the role does not exist.
 * @throws ValidationException if updated data is invalid.
 *
 * @example
 * const updated = await updateRoleUseCase.execute(roleId, { permissions: [...] });
 */

@Injectable()
export class UpdateRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly roleDomainService: RoleDomainService,
  ) {}

  async execute(id: string, dto: RoleUpdateDto): Promise<RoleResponseDto> {
    const entity = await this.roleRepository.findOneByField({
      field: 'id',
      value: id,
    });

    const updatedEntity = this.roleDomainService.updateRoleEntity(entity, dto);

    const updated = await this.roleRepository.save(updatedEntity);
    return new RoleResponseDto(updated);
  }
}
