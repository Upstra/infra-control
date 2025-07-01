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
      save: jest.fn(),
    } as any;

    roleDomainService = {
      toRoleEntity: jest.fn(),
    } as any;
    useCase = new CreateRoleUseCase(roleRepository, roleDomainService);
  });

  it('should create a role and return a RoleResponseDto', async () => {
    const dto: RoleCreationDto = { name: 'ADMIN' };
    const roleEntity = createMockRole({ name: 'ADMIN' });
    roleDomainService.toRoleEntity.mockReturnValue(roleEntity);
    roleRepository.save.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleDomainService.toRoleEntity).toHaveBeenCalledWith(dto);
    expect(roleRepository.save).toHaveBeenCalledWith(roleEntity);
    expect(result).toBeInstanceOf(RoleResponseDto);
    expect(result.name).toBe('ADMIN');
    expect(result.id).toBe(roleEntity.id);
  });

  it('should work with another role name', async () => {
    const dto: RoleCreationDto = { name: 'GUEST' };
    const roleEntity = createMockRole({ name: 'GUEST' });
    roleDomainService.toRoleEntity.mockReturnValue(roleEntity);
    roleRepository.save.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleDomainService.toRoleEntity).toHaveBeenCalledWith(dto);
    expect(roleRepository.save).toHaveBeenCalledWith(roleEntity);
    expect(result.name).toBe('GUEST');
  });

  it('should handle repository errors', async () => {
    const dto: RoleCreationDto = { name: 'BROKEN' };
    roleRepository.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });
});
