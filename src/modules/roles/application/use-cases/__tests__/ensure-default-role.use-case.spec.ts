import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { EnsureDefaultRoleUseCase } from '../ensure-default-role.use-case';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

describe('EnsureDefaultRoleUseCase', () => {
  let useCase: EnsureDefaultRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;

  beforeEach(() => {
    roleRepository = {
      findAll: jest.fn(),
      createRole: jest.fn(),
      findOneByField: jest.fn(),
      save: jest.fn(),
    } as any;

    userRepository = {
      count: jest.fn(),
    } as any;
    useCase = new EnsureDefaultRoleUseCase(roleRepository, userRepository);
  });

  it('should create admin if no role and no user', async () => {
    roleRepository.findAll.mockResolvedValue([]);
    userRepository.count.mockResolvedValue(0);

    const admin = createMockRole({ name: 'ADMIN', canCreateServer: true });
    roleRepository.createRole.mockResolvedValue(admin);
    roleRepository.save.mockResolvedValue(admin);

    const result = await useCase.execute();

    expect(roleRepository.createRole).toHaveBeenCalledWith('ADMIN');
    expect(result.name).toBe('ADMIN');
    expect(result.canCreateServer).toBe(true);
  });

  it('should update admin rights if userCount = 0 and admin canCreateServer is false', async () => {
    userRepository.count.mockResolvedValue(0);

    const admin = createMockRole({ name: 'ADMIN', canCreateServer: false });
    roleRepository.findAll.mockResolvedValue([admin]);
    roleRepository.findOneByField.mockResolvedValue(admin);

    const updatedAdmin = createMockRole({ ...admin, canCreateServer: true });
    roleRepository.save.mockResolvedValue(updatedAdmin);

    const result = await useCase.execute();

    expect(roleRepository.save).toHaveBeenCalled();
    expect(result.canCreateServer).toBe(true);
  });

  it('should create guest role if missing when users exist', async () => {
    userRepository.count.mockResolvedValue(5);
    roleRepository.findAll.mockResolvedValue([
      createMockRole({ name: 'ADMIN' }),
    ]);
    roleRepository.findOneByField.mockResolvedValue(null);
    const guest = createMockRole({ name: 'GUEST' });
    roleRepository.createRole.mockResolvedValue(guest);

    const result = await useCase.execute();

    expect(roleRepository.createRole).toHaveBeenCalledWith('GUEST');
    expect(result.name).toBe('GUEST');
  });
});
