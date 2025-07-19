import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { GetUserCountUseCase } from '@/modules/users/application/use-cases';
import { EnsureDefaultRoleUseCase } from '../ensure-default-role.use-case';

describe('EnsureDefaultRoleUseCase', () => {
  let useCase: EnsureDefaultRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let getUserCountUseCase: jest.Mocked<GetUserCountUseCase>;

  beforeEach(() => {
    roleRepository = {
      findAll: jest.fn(),
      createRole: jest.fn(),
      findOneByField: jest.fn(),
      save: jest.fn(),
    } as any;

    getUserCountUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new EnsureDefaultRoleUseCase(roleRepository, getUserCountUseCase);
  });

  it('should create admin and guest roles if no role and no user', async () => {
    roleRepository.findAll.mockResolvedValue([]);
    getUserCountUseCase.execute.mockResolvedValue(0);

    const admin = createMockRole({
      name: 'ADMIN',
      canCreateServer: false,
      isAdmin: true,
    });
    const guest = createMockRole({
      name: 'GUEST',
      canCreateServer: false,
      isAdmin: false,
    });

    roleRepository.createRole
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce(guest);

    const adminWithCanCreateServer = createMockRole({
      ...admin,
      canCreateServer: true,
    });

    roleRepository.save
      .mockResolvedValueOnce(adminWithCanCreateServer)
      .mockResolvedValueOnce(guest);

    const result = await useCase.execute();

    expect(roleRepository.createRole).toHaveBeenCalledWith('ADMIN');
    expect(roleRepository.createRole).toHaveBeenCalledWith('GUEST');
    expect(roleRepository.createRole).toHaveBeenCalledTimes(2);
    expect(roleRepository.save).toHaveBeenCalledTimes(2);
    expect(result.name).toBe('ADMIN');
    expect(result.canCreateServer).toBe(true);
  });

  it('should update admin rights if userCount = 0 and admin canCreateServer is false', async () => {
    getUserCountUseCase.execute.mockResolvedValue(0);

    const admin = createMockRole({
      name: 'ADMIN',
      canCreateServer: false,
      isAdmin: true,
    });
    roleRepository.findAll.mockResolvedValue([admin]);
    roleRepository.findOneByField.mockResolvedValue(admin);

    const updatedAdmin = createMockRole({
      ...admin,
      canCreateServer: true,
      isAdmin: true,
    });
    roleRepository.save.mockResolvedValue(updatedAdmin);

    const result = await useCase.execute();

    expect(roleRepository.save).toHaveBeenCalled();
    expect(result.canCreateServer).toBe(true);
  });

  it('should create guest role if missing when users exist', async () => {
    getUserCountUseCase.execute.mockResolvedValue(5);
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
