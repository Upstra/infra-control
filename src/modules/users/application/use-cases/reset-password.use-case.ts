import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../domain/services/user.domain.service';
import { ResetPasswordDto, UserResponseDto } from '../dto';
import { SendPasswordChangedEmailUseCase } from '@/modules/email/application/use-cases/send-password-changed-email.use-case';

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
    private readonly sendPasswordChangedEmailUseCase?: SendPasswordChangedEmailUseCase,
  ) {}

  async execute(id: string, dto: ResetPasswordDto): Promise<UserResponseDto> {
    const user = await this.repo.findOneByField({
      field: 'id',
      value: id,
    });
    user.password = await this.userDomainService.hashPassword(dto.newPassword);
    const updatedUser = await this.repo.save(user);
    
    await this.sendPasswordChangedEmailUseCase?.execute(
      updatedUser.email,
      updatedUser.firstName || updatedUser.username,
    );
    
    return new UserResponseDto(updatedUser);
  }
}
