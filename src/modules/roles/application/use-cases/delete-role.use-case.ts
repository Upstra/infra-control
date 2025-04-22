import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';

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
