import { Inject, Injectable } from '@nestjs/common';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { CannotDeleteLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    roleId: string | null,
  ): Promise<UserResponseDto> {
    const current = await this.repo.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
    });

    if (current.roles?.some((r) => r.isAdmin) && (await this.repo.countAdmins()) === 1) {
      let newRoleIsAdmin = false;
      if (roleId) {
        const role = await this.roleRepo.findOneByField({
          field: 'id',
          value: roleId,
        });
        newRoleIsAdmin = role.isAdmin;
      }
      if (!newRoleIsAdmin) {
        throw new CannotDeleteLastAdminException();
      }
    }

    if (roleId) {
      const role = await this.roleRepo.findOneByField({
        field: 'id',
        value: roleId,
      });
      current.roles = [role];
    } else {
      current.roles = [];
    }

    const saved = await this.repo.save(current);
    return new UserResponseDto(saved);
  }
}
