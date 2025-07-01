import { CreateRoleUseCase } from '../create-role.use-case';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { RoleCreationDto } from '../../dto/role.creation.dto';
import { RoleResponseDto } from '../../dto/role.response.dto';
import { RoleDomainService } from '@/modules/roles/domain/services/role.domain.service';

jest.mock('@/modules/roles/__mocks__/role.mock', () => ({
  createMockRole: jest.fn((overrides) => ({
    id: 'role-id-123',
    name: 'ADMIN',
    users: [],
    permissionServers: [],
    permissionVms: [],
    canCreateServer: true,
    ...overrides,
  })),
}));

const { createMockRole } = require('@/modules/roles/__mocks__/role.mock');

describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let roleDomainService: jest.Mocked<RoleDomainService>;

  beforeEach(() => {
    roleRepository = {
      createRole: jest.fn(),
    } as any;

    roleDomainService = {
      toRoleEntity: jest.fn(),
    } as any;
    roleDomainService.toRoleEntity.mockImplementation((dto) =>
      createMockRole({ name: dto.name }),
    );
    useCase = new CreateRoleUseCase(roleRepository, roleDomainService);
  });

  it('should create a role and return a RoleResponseDto', async () => {
    const dto: RoleCreationDto = { name: 'ADMIN' };
    const roleEntity = createMockRole({ name: 'ADMIN' });
    roleRepository.createRole.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleRepository.createRole).toHaveBeenCalledWith('ADMIN');
    expect(result).toBeInstanceOf(RoleResponseDto);
    expect(result.name).toBe('ADMIN');
    expect(result.id).toBe(roleEntity.id);
  });

  it('should work with another role name', async () => {
    const dto: RoleCreationDto = { name: 'GUEST' };
    const roleEntity = createMockRole({ name: 'GUEST' });
    roleRepository.createRole.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleRepository.createRole).toHaveBeenCalledWith('GUEST');
    expect(result.name).toBe('GUEST');
  });

  it('should handle repository errors', async () => {
    const dto: RoleCreationDto = { name: 'BROKEN' };
    roleRepository.createRole.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });
});
