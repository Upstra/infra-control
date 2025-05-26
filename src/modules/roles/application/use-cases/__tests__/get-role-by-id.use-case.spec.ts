import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { GetRoleByIdUseCase } from '../get-role-by-id.use-case';

describe('GetRoleByIdUseCase', () => {
  let useCase: GetRoleByIdUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    roleRepository = {
      findOneByField: jest.fn(),
    } as any;

    useCase = new GetRoleByIdUseCase(roleRepository);
  });

  it('should return a RoleResponseDto for given id', async () => {
    const role = createMockRole({ id: 'role-uuid', name: 'ADMIN' });
    roleRepository.findOneByField.mockResolvedValue(role);

    const result = await useCase.execute('role-uuid');

    expect(roleRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'role-uuid',
      relations: ['users', 'permissionServers', 'permissionVms'],
    });
    expect(result.name).toBe('ADMIN');
  });

  it('should throw if not found', async () => {
    roleRepository.findOneByField.mockRejectedValue(new Error('Not found'));
    await expect(useCase.execute('not-found')).rejects.toThrow('Not found');
  });
});
