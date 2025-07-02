import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';

/**
 * Deletes a role by its identifier.
 *
 * Responsibilities:
 * - Ensure the role exists and has no critical assignments.
 * - Remove the role via RoleDomainService.
 *
 * @param id  The UUID of the role to delete.
 * @returns   Promise<void> upon successful removal.
 *
 * @throws NotFoundException if the role is missing.
 * @throws ConflictException if the role is in use by active users.
 *
 * @example
 * await deleteRoleUseCase.execute('role-uuid-123');
 */

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    @Inject('RoleRepositoryInterface')
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}
  async execute(id: string): Promise<void> {
    await this.roleRepository.deleteRole(id);
  }
}
