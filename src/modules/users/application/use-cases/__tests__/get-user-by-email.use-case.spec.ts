import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { GetUserByEmailUseCase } from '../get-user-by-email.use-case';
import { User } from '@/modules/users/domain/entities/user.entity';

describe('GetUserByEmailUseCase', () => {
  let useCase: GetUserByEmailUseCase;
  let userRepo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    userRepo = {
      findOneByField: jest.fn(),
    } as any;

    useCase = new GetUserByEmailUseCase(userRepo);
  });

  it('should return user if found', async () => {
    const user = { id: 'id1', email: 'james@mail.com' } as User;
    userRepo.findOneByField.mockResolvedValue(user);

    const result = await useCase.execute('james@mail.com');
    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'email',
      value: 'james@mail.com',
    });
    expect(result).toBe(user);
  });

  it('should return null if user not found', async () => {
    userRepo.findOneByField.mockResolvedValue(null);

    const result = await useCase.execute('absent@mail.com');
    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'email',
      value: 'absent@mail.com',
    });
    expect(result).toBeNull();
  });

  it('should propagate unexpected error', async () => {
    userRepo.findOneByField.mockRejectedValue(new Error('DB down'));

    await expect(useCase.execute('fail@mail.com')).rejects.toThrow('DB down');
    expect(userRepo.findOneByField).toHaveBeenCalledWith({
      field: 'email',
      value: 'fail@mail.com',
    });
  });
});
