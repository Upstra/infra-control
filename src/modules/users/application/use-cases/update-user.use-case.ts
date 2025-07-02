import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { UserResponseDto } from '../dto/user.response.dto';
import { UserUpdateDto } from '../dto/user.update.dto';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { CannotDeleteLastAdminException } from '../../domain/exceptions/user.exception';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    @Inject('RoleRepositoryInterface')
    private readonly roleRepo: RoleRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: UserUpdateDto,
    userId?: string,
  ): Promise<UserResponseDto> {
    let user = await this.repo.findOneByField({
      field: 'id',
      value: id,
      relations: ['role'],
    });

    await this.userDomainService.ensureUniqueEmail(dto.email, id);
    await this.userDomainService.ensureUniqueUsername(dto.username, id);

    if (dto.roleId && dto.roleId !== user.roleId && user.role.isAdmin) {
      const adminCount = await this.repo.countAdmins();
      if (adminCount === 1) {
        const newRole = await this.roleRepo.findOneByField({
          field: 'id',
          value: dto.roleId,
        });
        if (!newRole.isAdmin) {
          throw new CannotDeleteLastAdminException();
        }
      }
    }

    user = await this.userDomainService.updateUserEntity(user, dto);
    user = await this.repo.save(user);

    if (!userId) {
      userId = user.id;
    }

    await this.logHistory?.execute('user', user.id, 'UPDATE', userId);
    return new UserResponseDto(user);
  }
}
