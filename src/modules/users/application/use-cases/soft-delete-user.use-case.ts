import { Injectable, Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserExceptions } from '../../domain/exceptions/user.exception';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';
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
      throw UserExceptions.notFound(targetUserId);
    }

    if (targetUserId === adminUserId) {
      throw UserExceptions.cannotDeleteOwnAccount();
    }

    const adminCount = await this.userRepository.countActiveAdmins();
    const isTargetAdmin = await this.isUserAdmin(targetUser);

    if (isTargetAdmin && adminCount <= 1) {
      throw UserExceptions.cannotDeleteLastAdmin();
    }

    targetUser.deletedAt = new Date();
    targetUser.isActive = false;

    const updatedUser = await this.userRepository.save(targetUser);

    await this.logHistory.executeStructured({
      entity: 'user',
      entityId: targetUserId,
      action: 'USER_DELETED',
      userId: adminUserId,
      oldValue: {
        isActive: true,
        deletedAt: null,
      },
      newValue: {
        isActive: false,
        deletedAt: updatedUser.deletedAt,
      },
      metadata: {
        deletedBy: adminUserId,
        deletedAt: updatedUser.deletedAt?.toISOString(),
        reason,
        details,
        userEmail: targetUser.email || '',
        username: targetUser.username,
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
