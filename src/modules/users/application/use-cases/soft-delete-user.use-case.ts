import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import {
  CannotDeleteLastAdminException,
  CannotDeleteOwnAccountException,
  UserNotFoundException,
} from '../../domain/exceptions/user.exception';
import { LogHistoryUseCase } from '@modules/history/application/use-cases';
import { DeletionReason } from '../dto/delete-account.dto';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class SoftDeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject(LogHistoryUseCase)
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    targetUserId: string,
    adminUserId: string,
    _reason: DeletionReason = DeletionReason.ADMIN_ACTION,
    _details?: string,
    _ipAddress?: string,
    _userAgent?: string,
  ): Promise<void> {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new UserNotFoundException(targetUserId);
    }

    if (targetUserId === adminUserId) {
      throw new CannotDeleteOwnAccountException();
    }

    const adminCount = await this.userRepository.countActiveAdmins();
    const isTargetAdmin = await this.isUserAdmin(targetUser);

    if (isTargetAdmin && adminCount <= 1) {
      throw new CannotDeleteLastAdminException();
    }

    // TODO: For now, we use the softDeleteUser method which sets deletedAt - add loghistory too
    await this.userRepository.deleteUser(targetUserId);
  }

  private async isUserAdmin(user: User): Promise<boolean> {
    const userWithRoles = await this.userRepository.findWithRoles(user.id);
    if (!userWithRoles) return false;

    return userWithRoles.roles.some((role) => role.isAdmin === true);
  }
}
