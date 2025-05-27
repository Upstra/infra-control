import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { GetUserByIdUseCase } from '../get-user-by-id.use-case';
import { UserResponseDto } from '../../dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findOneByField: jest.fn(),
    } as any;

    useCase = new GetUserByIdUseCase(repo);
  });

  it('should return UserResponseDto if user is found', async () => {
    const user = createMockUser({
      id: 'id1',
      username: 'james',
      email: 'james@bond.com',
    });

    repo.findOneByField.mockResolvedValue(user);

    const result = await useCase.execute('id1');
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'id1',
    });
    expect(result).toBeInstanceOf(UserResponseDto);
    expect(result.id).toBe(user.id);
    expect(result.username).toBe(user.username);
  });

  it('should throw if user not found', async () => {
    repo.findOneByField.mockResolvedValue(null);

    await expect(useCase.execute('inexistant-id')).rejects.toThrow();
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'inexistant-id',
    });
  });

  it('should propagate repository errors', async () => {
    repo.findOneByField.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute('id1')).rejects.toThrow('DB error');
    expect(repo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'id1',
    });
  });
});
