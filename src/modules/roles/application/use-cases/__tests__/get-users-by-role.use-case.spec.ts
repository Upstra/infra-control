import { GetUsersByRoleUseCase } from '../get-users-by-role.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { PresenceService } from '@/modules/presence/application/services/presence.service';

describe('GetUsersByRoleUseCase', () => {
  let useCase: GetUsersByRoleUseCase;
  let repo: jest.Mocked<UserRepositoryInterface>;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;
  let presenceService: jest.Mocked<PresenceService>;

  beforeEach(() => {
    repo = { findAllByField: jest.fn() } as any;
    roleRepo = { findOneByField: jest.fn() } as any;
    presenceService = { isOnline: jest.fn() } as any;
    useCase = new GetUsersByRoleUseCase(repo, roleRepo, presenceService);
  });

  it('should return users for role', async () => {
    const user = createMockUser({ id: 'u1', roles: [{ id: 'r1' }] });
    roleRepo.findOneByField.mockResolvedValue(Object.assign(createMockRole(), { users: [user] }));

    const result = await useCase.execute('r1');

    expect(roleRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'r1',
      relations: ['users', 'users.roles'],
    });
    expect(presenceService.isOnline).toHaveBeenCalledWith(user.id);
    expect(result).toEqual([new UserResponseDto(user)]);
  });

  it('should propagate errors', async () => {
    roleRepo.findOneByField.mockRejectedValue(new Error('fail'));
    presenceService.isOnline.mockImplementation(() => {
      throw new Error('fail');
    });
    await expect(useCase.execute('r1')).rejects.toThrow('fail');
  });
});
