import { GetAllRolesUseCase } from '../get-all-roles.use-case';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('GetAllRolesUseCase', () => {
  let useCase: GetAllRolesUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    roleRepository = {
      findAll: jest.fn(),
    } as any;

    useCase = new GetAllRolesUseCase(roleRepository);
  });

  it('should return RoleResponseDto[] for all roles', async () => {
    const roles = [
      createMockRole({ name: 'ADMIN' }),
      createMockRole({ name: 'GUEST' }),
    ];
    roleRepository.findAll.mockResolvedValue(roles);

    const result = await useCase.execute();

    expect(roleRepository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('ADMIN');
    expect(result[1].name).toBe('GUEST');
  });

  it('should return empty array if no roles found', async () => {
    roleRepository.findAll.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
