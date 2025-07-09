import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRepositoryInterface } from '../../../users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '../../../users/domain/services/user.domain.service';
import { EmailEventType } from '../../../email/domain/events/email.events';
import { LogHistoryUseCase } from '../../../history/application/use-cases/log-history.use-case';

@Injectable()
export class ResetPasswordWithTokenUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly userDomainService: UserDomainService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async execute(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOneByField({
      field: 'resetPasswordToken',
      value: token,
    });

    if (!user?.resetPasswordToken || !user?.resetPasswordExpiry) {
      throw new UnauthorizedException('Token de réinitialisation invalide');
    }

    if (user.resetPasswordExpiry < new Date()) {
      throw new UnauthorizedException('Le token de réinitialisation a expiré');
    }

    const oldPasswordHash = user.password;
    user.password = await this.userDomainService.hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await this.userRepository.save(user);

    this.eventEmitter.emit(EmailEventType.PASSWORD_CHANGED, {
      email: user.email,
      firstname: user.firstName || user.username,
    });

    await this.logHistoryUseCase.executeStructured({
      entity: 'user',
      entityId: user.id,
      action: 'PASSWORD_RESET_WITH_TOKEN',
      userId: user.id,
      oldValue: { passwordHash: oldPasswordHash },
      newValue: { passwordHash: user.password },
      metadata: {
        performedBy: 'self',
        method: 'token',
      },
    });

    return { message: 'Votre mot de passe a été réinitialisé avec succès' };
  }
}
