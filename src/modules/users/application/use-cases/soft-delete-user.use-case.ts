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
    reason: DeletionReason = DeletionReason.ADMIN_ACTION,
    details?: string,
    ipAddress?: string,
    userAgent?: string,
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

    const oldValue = {
      isActive: targetUser.isActive,
      deletedAt: targetUser.deletedAt,
    };

    await this.userRepository.deleteUser(targetUserId);

    await this.logHistory.executeStructured({
      entity: 'user',
      entityId: targetUserId,
      action: 'USER_DELETED',
      userId: adminUserId,
      oldValue,
      newValue: {
        isActive: false,
        deletedAt: new Date(),
      },
      metadata: {
        reason,
        details,
        username: targetUser.username,
        userEmail: targetUser.email || '',
        deletedBy: adminUserId,
        deletedAt: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  private async isUserAdmin(user: User): Promise<boolean> {
    const userWithRoles = await this.userRepository.findWithRoles(user.id);
    if (!userWithRoles) return false;

    return userWithRoles.roles.some((role) => role.isAdmin === true);
  }
}
