import { GetUsersByRoleUseCase } from '../get-users-by-role.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';

describe('GetUsersByRoleUseCase', () => {
  let useCase: GetUsersByRoleUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findAllByField: jest.fn(),
    } as any;
    useCase = new GetUsersByRoleUseCase(repo);
  });

  it('should return users for role', async () => {
    const user = createMockUser({ id: 'u1', roleId: 'r1' });
    repo.findAllByField.mockResolvedValue([user]);

    const result = await useCase.execute('r1');

    expect(repo.findAllByField).toHaveBeenCalledWith({
      field: 'roleId',
      value: 'r1',
      relations: ['role'],
    });
    expect(result).toEqual([new UserResponseDto(user)]);
  });

  it('should propagate errors', async () => {
    repo.findAllByField.mockRejectedValue(new Error('fail'));
    await expect(useCase.execute('r1')).rejects.toThrow('fail');
  });
});
