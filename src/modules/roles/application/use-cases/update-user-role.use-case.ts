import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UpdateUserFieldsUseCase } from '@/modules/users/application/use-cases';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '../../domain/interfaces/role.repository.interface';
import { CannotDeleteLastAdminException } from '@/modules/users/domain/exceptions/user.exception';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(forwardRef(() => UpdateUserFieldsUseCase))
    private readonly updateUserFields: UpdateUserFieldsUseCase,
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
      relations: ['role'],
    });

    if (current.role.isAdmin && (await this.repo.countAdmins()) === 1) {
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

    const user = await this.updateUserFields.execute(userId, { roleId });
    return new UserResponseDto(user);
  }
}
