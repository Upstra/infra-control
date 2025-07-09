import { ResetPasswordUseCase } from '../reset-password.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { UserDomainService } from '@/modules/users/domain/services/user.domain.service';
import { User } from '@/modules/users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import {
  UserExceptions,
  UserNotFoundException,
} from '@/modules/users/domain/exceptions/user.exception';
import { SendPasswordChangedEmailUseCase } from '@/modules/email/application/use-cases/send-password-changed-email.use-case';
describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let domainService: jest.Mocked<UserDomainService>;
  let emailService: jest.Mocked<SendPasswordChangedEmailUseCase>;

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
      save: jest.fn(),
    } as any;

    domainService = {
      hashPassword: jest.fn(),
    } as any;

    emailService = {
      execute: jest.fn(),
    } as any;

    useCase = new ResetPasswordUseCase(repo, domainService, emailService);
  });

  it('should reset password and return updated user response', async () => {
    const user = createMockUser();
    const hashedPassword = 'newHashedPassword';

    repo.findOneByField.mockResolvedValue(user);
    domainService.hashPassword.mockResolvedValue(hashedPassword);

    repo.save.mockResolvedValue(
      Object.assign(new User(), { ...user, password: hashedPassword }),
    );
    const dto = { newPassword: 'newPassword123' };

    const result = await useCase.execute('user-id', dto);

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'user-id',
    });
    expect(domainService.hashPassword).toHaveBeenCalledWith('newPassword123');
    expect(repo.save).toHaveBeenCalledWith({
      ...user,
      password: hashedPassword,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    );

    expect(emailService.execute).toHaveBeenCalledWith(
      user.email,
      user.firstName || user.username,
    );
  });

  it('should throw if user is not found', async () => {
    repo.findOneByField.mockRejectedValue(
      UserExceptions.notFound('invalid-id'),
    );

    await expect(
      useCase.execute('invalid-id', { newPassword: '123456' }),
    ).rejects.toThrow(UserNotFoundException);
  });

  it('should throw if password hashing fails', async () => {
    const user = createMockUser();
    repo.findOneByField.mockResolvedValue(user);
    domainService.hashPassword.mockRejectedValue(new Error('hash failed'));

    await expect(
      useCase.execute('user-id', { newPassword: '123456' }),
    ).rejects.toThrow('hash failed');
  });

  it('should throw if saving the user fails', async () => {
    const user = createMockUser();
    repo.findOneByField.mockResolvedValue(user);
    domainService.hashPassword.mockResolvedValue('hashedPassword');
    repo.save.mockRejectedValue(new Error('save failed'));

    await expect(
      useCase.execute('user-id', { newPassword: '123456' }),
    ).rejects.toThrow('save failed');
  });

  it('should send email with username when firstName is not available', async () => {
    const mockUser = createMockUser();
    const user = Object.assign(new User(), { ...mockUser, firstName: null });
    const hashedPassword = 'newHashedPassword';

    repo.findOneByField.mockResolvedValue(user);
    domainService.hashPassword.mockResolvedValue(hashedPassword);
    repo.save.mockResolvedValue(
      Object.assign(new User(), { ...user, password: hashedPassword }),
    );

    await useCase.execute('user-id', { newPassword: 'newPassword123' });

    expect(emailService.execute).toHaveBeenCalledWith(
      user.email,
      user.username,
    );
  });

  it('should work without email service', async () => {
    const user = createMockUser();
    const hashedPassword = 'newHashedPassword';

    repo.findOneByField.mockResolvedValue(user);
    domainService.hashPassword.mockResolvedValue(hashedPassword);
    repo.save.mockResolvedValue(
      Object.assign(new User(), { ...user, password: hashedPassword }),
    );

    const useCaseWithoutEmail = new ResetPasswordUseCase(repo, domainService);
    const result = await useCaseWithoutEmail.execute('user-id', { 
      newPassword: 'newPassword123' 
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
      }),
    );
  });
});
