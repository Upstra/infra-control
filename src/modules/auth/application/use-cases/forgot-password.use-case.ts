import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { User } from '../../../users/domain/entities/user.entity';
import { UserRepositoryInterface } from '../../../users/domain/interfaces/user.repository.interface';
import { EmailEventType } from '../../../email/domain/events/email.events';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly eventEmitter: EventEmitter2,
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOneByField({
        field: 'email',
        value: email,
        disableThrow: true,
      });

      if (!user) {
        this.logger.warn(
          `Forgot password attempt for non-existent email: ${email}`,
        );
        return {
          message:
            'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
        };
      }

      if (user.resetPasswordToken && user.resetPasswordExpiry) {
        const now = new Date();
        if (user.resetPasswordExpiry > now) {
          this.logger.log(
            `Existing valid reset token found for ${email}, not generating new one`,
          );

          await this.logPasswordResetAttempt(user, 'existing_token_reused');

          return {
            message:
              'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
          };
        }
      }

      const resetToken = randomBytes(32).toString('hex');
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = expiryTime;
      await this.userRepository.save(user);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      this.eventEmitter.emit(EmailEventType.PASSWORD_RESET, {
        email: user.email,
        firstName: user.firstName,
        resetLink,
      });

      await this.logPasswordResetRequest(user);
      await this.logPasswordResetAttempt(user, 'new_token_generated');

      return {
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      };
    } catch (error) {
      this.logger.error(
        `Error in forgot password use case: ${error.message}`,
      );
      return {
        message:
          'Si un compte existe avec cette adresse email, un lien de réinitialisation sera envoyé.',
      };
    }
  }

  private async logPasswordResetRequest(user: User): Promise<void> {
    await this.logHistoryUseCase.executeStructured({
      entity: 'user',
      entityId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      metadata: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private async logPasswordResetAttempt(
    user: User,
    attemptType: 'new_token_generated' | 'existing_token_reused',
  ): Promise<void> {
    await this.logHistoryUseCase.executeStructured({
      entity: 'user',
      entityId: user.id,
      action: 'PASSWORD_RESET_ATTEMPT',
      userId: user.id,
      metadata: {
        email: user.email,
        attemptType,
        tokenExpiry: user.resetPasswordExpiry?.toISOString(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}
