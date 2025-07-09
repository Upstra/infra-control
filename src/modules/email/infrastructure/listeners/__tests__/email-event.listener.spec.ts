import { EmailEventListener } from '../email-event.listener';
import { SendAccountCreatedEmailUseCase } from '../../../application/use-cases/send-account-created-email.use-case';
import { SendPasswordChangedEmailUseCase } from '../../../application/use-cases/send-password-changed-email.use-case';
import { SendResetPasswordEmailUseCase } from '../../../application/use-cases/send-reset-password-email.use-case';

describe('EmailEventListener', () => {
  let listener: EmailEventListener;
  let sendAccountCreated: jest.Mocked<SendAccountCreatedEmailUseCase>;
  let sendPasswordChanged: jest.Mocked<SendPasswordChangedEmailUseCase>;
  let sendResetPassword: jest.Mocked<SendResetPasswordEmailUseCase>;

  beforeEach(() => {
    sendAccountCreated = {
      execute: jest.fn(),
    } as any;

    sendPasswordChanged = {
      execute: jest.fn(),
    } as any;

    sendResetPassword = {
      execute: jest.fn(),
    } as any;

    listener = new EmailEventListener(
      sendAccountCreated,
      sendPasswordChanged,
      sendResetPassword,
    );

    jest.spyOn(listener['logger'], 'log').mockImplementation();
    jest.spyOn(listener['logger'], 'error').mockImplementation();
  });

  describe('handleAccountCreated', () => {
    it('should send account created email', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
      };

      await listener.handleAccountCreated(payload);

      expect(sendAccountCreated.execute).toHaveBeenCalledWith(
        payload.email,
        payload.firstname,
      );
      expect(listener['logger'].log).toHaveBeenCalledWith(
        `Sending account created email to ${payload.email}`,
      );
    });

    it('should handle errors gracefully', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
      };
      const error = new Error('Email service failed');

      sendAccountCreated.execute.mockRejectedValue(error);

      await listener.handleAccountCreated(payload);

      expect(listener['logger'].error).toHaveBeenCalledWith(
        `Failed to send account created email to ${payload.email}`,
        error.stack,
      );
    });
  });

  describe('handlePasswordChanged', () => {
    it('should send password changed email', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        location: 'France',
      };

      await listener.handlePasswordChanged(payload);

      expect(sendPasswordChanged.execute).toHaveBeenCalledWith(
        payload.email,
        payload.firstname,
        payload.ipAddress,
        payload.userAgent,
        payload.location,
      );
      expect(listener['logger'].log).toHaveBeenCalledWith(
        `Sending password changed email to ${payload.email}`,
      );
    });

    it('should send password changed email without optional parameters', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
      };

      await listener.handlePasswordChanged(payload);

      expect(sendPasswordChanged.execute).toHaveBeenCalledWith(
        payload.email,
        payload.firstname,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should handle errors gracefully', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
      };
      const error = new Error('Email service failed');

      sendPasswordChanged.execute.mockRejectedValue(error);

      await listener.handlePasswordChanged(payload);

      expect(listener['logger'].error).toHaveBeenCalledWith(
        `Failed to send password changed email to ${payload.email}`,
        error.stack,
      );
    });
  });

  describe('handlePasswordReset', () => {
    it('should send password reset email', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
        resetLink: 'https://example.com/reset/token123',
      };

      await listener.handlePasswordReset(payload);

      expect(sendResetPassword.execute).toHaveBeenCalledWith(
        payload.email,
        payload.resetLink,
        payload.firstname,
      );
      expect(listener['logger'].log).toHaveBeenCalledWith(
        `Sending password reset email to ${payload.email}`,
      );
    });

    it('should handle errors gracefully', async () => {
      const payload = {
        email: 'test@example.com',
        firstname: 'John',
        resetLink: 'https://example.com/reset/token123',
      };
      const error = new Error('Email service failed');

      sendResetPassword.execute.mockRejectedValue(error);

      await listener.handlePasswordReset(payload);

      expect(listener['logger'].error).toHaveBeenCalledWith(
        `Failed to send password reset email to ${payload.email}`,
        error.stack,
      );
    });
  });
});
