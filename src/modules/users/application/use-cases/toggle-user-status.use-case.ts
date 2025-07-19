import { Injectable } from '@nestjs/common';
import { UserTypeormRepository } from '../../infrastructure/repositories/user.typeorm.repository';
import { UserResponseDto } from '../dto/user.response.dto';
import {
  CannotDeactivateLastAdminException,
  CannotToggleOwnStatusException,
  UserNotFoundException,
} from '../../domain/exceptions/user.exception';
import { User } from '../../domain/entities/user.entity';
import { LogHistoryUseCase } from '@modules/history/application/use-cases';

export interface ToggleUserStatusUseCaseInput {
  targetUserId: string;
  adminId: string;
  reason?: string;
  requestContext?: {
    ip?: string;
    userAgent?: string;
  };
}

@Injectable()
export class ToggleUserStatusUseCase {
  constructor(
    private readonly userRepository: UserTypeormRepository,
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(input: ToggleUserStatusUseCaseInput): Promise<UserResponseDto> {
    const { targetUserId, adminId, reason, requestContext } = input;

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundException();
    }

    if (targetUserId === adminId) {
      throw new CannotToggleOwnStatusException();
    }

    const userWithRoles = await this.userRepository.findWithRoles(targetUserId);
    const isTargetAdmin =
      userWithRoles?.roles?.some((role) => role.isAdmin) ?? false;

    if (isTargetAdmin && targetUser.isActive) {
      const activeAdminCount = await this.userRepository.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new CannotDeactivateLastAdminException();
      }
    }

    const previousStatus = targetUser.isActive;
    targetUser.isActive = !targetUser.isActive;

    if (targetUser.isActive && targetUser.deletedAt) {
      targetUser.deletedAt = null;
    }

    const updatedUser = await this.userRepository.save(targetUser);

    const action = previousStatus ? 'deactivated' : 'activated';
    await this.logHistoryUseCase.executeStructured({
      entity: 'user',
      entityId: targetUserId,
      action: `user.${action}`,
      userId: adminId,
      oldValue: { isActive: previousStatus },
      newValue: { isActive: targetUser.isActive },
      metadata: {
        username: targetUser.username,
        reason,
      },
      ipAddress: requestContext?.ip,
      userAgent: requestContext?.userAgent,
    });

    return this.mapToResponseDto(updatedUser);
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }
}
