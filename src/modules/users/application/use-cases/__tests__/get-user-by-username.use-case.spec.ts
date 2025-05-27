import { GetUserByUsernameUseCase } from '../get-user-by-username.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('GetUserByUsernameUseCase', () => {
  let useCase: GetUserByUsernameUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
    } as any;

    useCase = new GetUserByUsernameUseCase(repo);
  });

  it('should return user entity if found by username', async () => {
    const user = createMockUser({ username: 'james_bond' });
    repo.findOneByField.mockResolvedValue(user);

    const result = await useCase.execute('james_bond');

    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'username',
      value: 'james_bond',
    });

    expect(result).toBe(user);
  });

  it('should return null if user not found', async () => {
    repo.findOneByField.mockResolvedValue(null);

    const result = await useCase.execute('unknown_user');

    expect(result).toBeNull();
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'username',
      value: 'unknown_user',
    });
  });

  it('should throw if repository throws', async () => {
    repo.findOneByField.mockRejectedValue(new Error('DB down'));

    await expect(useCase.execute('fail_user')).rejects.toThrow('DB down');
  });
});
