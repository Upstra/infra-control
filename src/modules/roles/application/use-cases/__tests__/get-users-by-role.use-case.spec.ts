import { GetUsersByRoleUseCase } from '../get-users-by-role.use-case';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { PresenceService } from '@/modules/presence/application/services/presence.service';

describe('GetUsersByRoleUseCase', () => {
  let useCase: GetUsersByRoleUseCase;
  let roleRepo: jest.Mocked<RoleRepositoryInterface>;
  let presenceService: jest.Mocked<PresenceService>;

  beforeEach(() => {
    roleRepo = { findOneByField: jest.fn() } as any;
    presenceService = { isOnline: jest.fn() } as any;
    useCase = new GetUsersByRoleUseCase(roleRepo, presenceService);
  });

  it('should return users for role', async () => {
    const user = createMockUser({ id: 'u1', roles: [{ id: 'r1' }] });
    roleRepo.findOneByField.mockResolvedValue(
      Object.assign(createMockRole(), { users: [user] }),
    );

    const result = await useCase.execute('r1');

    expect(roleRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'r1',
      relations: ['users', 'users.roles'],
    });
    expect(presenceService.isOnline).toHaveBeenCalledWith(user.id);
    expect(result).toEqual([new UserResponseDto(user)]);
  });

  it('should filter out soft-deleted users', async () => {
    const activeUser = createMockUser({ id: 'u1', deletedAt: null });
    const deletedUser = createMockUser({ id: 'u2', deletedAt: new Date() });
    const role = Object.assign(createMockRole(), {
      users: [activeUser, deletedUser],
    });

    roleRepo.findOneByField.mockResolvedValue(role);
    presenceService.isOnline.mockResolvedValue(true);

    const result = await useCase.execute('r1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
    expect(presenceService.isOnline).toHaveBeenCalledTimes(1);
    expect(presenceService.isOnline).toHaveBeenCalledWith('u1');
  });

  it('should return empty array when role is not found', async () => {
    roleRepo.findOneByField.mockResolvedValue(null);

    const result = await useCase.execute('nonexistent-role');

    expect(roleRepo.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'nonexistent-role',
      relations: ['users', 'users.roles'],
    });
    expect(result).toEqual([]);
    expect(presenceService.isOnline).not.toHaveBeenCalled();
  });

  it('should return empty array when role has no users property', async () => {
    const roleWithoutUsers = createMockRole();
    delete roleWithoutUsers.users;

    roleRepo.findOneByField.mockResolvedValue(roleWithoutUsers);

    const result = await useCase.execute('r1');

    expect(result).toEqual([]);
    expect(presenceService.isOnline).not.toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    roleRepo.findOneByField.mockRejectedValue(new Error('fail'));
    presenceService.isOnline.mockImplementation(() => {
      throw new Error('fail');
    });
    await expect(useCase.execute('r1')).rejects.toThrow('fail');
  });
});
