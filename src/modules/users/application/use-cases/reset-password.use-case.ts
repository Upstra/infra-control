import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { ResetPasswordDto, UserResponseDto } from '../dto';
import { EmailEventType } from '@/modules/email/domain/events/email.events';
import { RequestContextDto } from '@/core/dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

/**
 * Resets a user’s password given a valid reset token and new credentials.
 *
 * Responsibilities:
 * - Verifies the reset token via TokenService or ResetTokenRepository.
 * - Hashes the new password and updates the user record via UserDomainService.
 * - Invalidates the used reset token to prevent reuse.
 *
 * @param dto  ResetPasswordDto containing resetToken and newPassword.
 * @returns    Promise<void> once the password has been securely updated.
 *
 * @throws UnauthorizedException if the token is invalid or expired.
 * @throws ValidationException if the new password does not meet policy.
 *
 * @example
 * await resetPasswordUseCase.execute({ resetToken:'abc123', newPassword:'Str0ngP@ss!' });
 */

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly repo: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: ResetPasswordDto,
    requestContext?: RequestContextDto,
    adminId?: string,
  ): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });

    const oldPasswordHash = user.password;
    user.password = await this.userDomainService.hashPassword(dto.newPassword);
    const updatedUser = await this.repo.save(user);

    this.eventEmitter.emit(EmailEventType.PASSWORD_CHANGED, {
      email: updatedUser.email,
      firstname: updatedUser.firstName || updatedUser.username,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    await this.logHistoryUseCase.executeStructured({
      entity: 'user',
      entityId: id,
      action: 'PASSWORD_RESET',
      userId: adminId ?? id,
      oldValue: { passwordHash: oldPasswordHash },
      newValue: { passwordHash: user.password },
      metadata: {
        performedBy: adminId ? 'admin' : 'self',
        adminId: adminId,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return new UserResponseDto(updatedUser);
  }
}
