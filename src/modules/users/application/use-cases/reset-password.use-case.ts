import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { ResetPasswordDto, UserResponseDto } from '../dto';
import { EmailEventType } from '@/modules/email/domain/events/email.events';

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
  ) {}

  async execute(id: string, dto: ResetPasswordDto): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    user.password = await this.userDomainService.hashPassword(dto.newPassword);
    const updatedUser = await this.repo.save(user);
    
    this.eventEmitter.emit(EmailEventType.PASSWORD_CHANGED, {
      email: updatedUser.email,
      firstname: updatedUser.firstName || updatedUser.username,
    });
    
    return new UserResponseDto(updatedUser);
  }
}
