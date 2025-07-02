import { CreateRoleUseCase } from '../create-role.use-case';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { RoleCreationDto } from '../../dto/role.creation.dto';
import { AdminRoleCreationDto } from '../../dto/role.creation.dto';
import { RoleResponseDto } from '../../dto/role.response.dto';
import { RoleDomainService } from '@/modules/roles/domain/services/role.domain.service';
import {
  AdminRoleAlreadyExistsException,
  SystemRoleNameAlreadyExistsException,
} from '@/modules/roles/domain/exceptions/role.exception';

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
      findOneByField: jest.fn(),
    } as any;

    roleDomainService = {
      toRoleEntity: jest.fn(),
    } as any;
    useCase = new CreateRoleUseCase(roleRepository, roleDomainService);
  });

  it('should create a role and return a RoleResponseDto', async () => {
    const dto: RoleCreationDto = { name: 'DEVELOPER' };
    const roleEntity = createMockRole({ name: 'DEVELOPER' });
    roleDomainService.toRoleEntity.mockReturnValue(roleEntity);
    roleRepository.save.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleDomainService.toRoleEntity).toHaveBeenCalledWith(dto);
    expect(roleRepository.save).toHaveBeenCalledWith(roleEntity);
    expect(result).toBeInstanceOf(RoleResponseDto);
    expect(result.name).toBe('DEVELOPER');
    expect(result.id).toBe(roleEntity.id);
  });

  it('should work with another role name', async () => {
    const dto: RoleCreationDto = { name: 'MANAGER' };
    const roleEntity = createMockRole({ name: 'MANAGER' });
    roleDomainService.toRoleEntity.mockReturnValue(roleEntity);
    roleRepository.save.mockResolvedValue(roleEntity);

    const result = await useCase.execute(dto);

    expect(roleDomainService.toRoleEntity).toHaveBeenCalledWith(dto);
    expect(roleRepository.save).toHaveBeenCalledWith(roleEntity);
    expect(result.name).toBe('MANAGER');
  });

  it('should handle repository errors', async () => {
    const dto: RoleCreationDto = { name: 'BROKEN' };
    roleRepository.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });

  it('throws if admin role already exists', async () => {
    const dto: AdminRoleCreationDto = Object.assign(
      new AdminRoleCreationDto(),
      {
        name: 'CUSTOM_ADMIN',
        isAdmin: true,
        canCreateServer: true,
      },
    );
    roleRepository.findOneByField.mockResolvedValue(
      createMockRole({ isAdmin: true }),
    );
    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      AdminRoleAlreadyExistsException,
    );
  });

  it('should throw error when trying to create role with ADMIN name', async () => {
    const dto: RoleCreationDto = { name: 'ADMIN' };

    await expect(useCase.execute(dto)).rejects.toThrow(
      SystemRoleNameAlreadyExistsException,
    );

    expect(roleDomainService.toRoleEntity).not.toHaveBeenCalled();
    expect(roleRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when trying to create role with GUEST name', async () => {
    const dto: RoleCreationDto = { name: 'GUEST' };

    await expect(useCase.execute(dto)).rejects.toThrow(
      SystemRoleNameAlreadyExistsException,
    );

    expect(roleDomainService.toRoleEntity).not.toHaveBeenCalled();
    expect(roleRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when trying to create role with lowercase admin name', async () => {
    const dto: RoleCreationDto = { name: 'admin' };

    await expect(useCase.execute(dto)).rejects.toThrow(
      SystemRoleNameAlreadyExistsException,
    );

    expect(roleDomainService.toRoleEntity).not.toHaveBeenCalled();
    expect(roleRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when trying to create role with mixed case guest name', async () => {
    const dto: RoleCreationDto = { name: 'Guest' };

    await expect(useCase.execute(dto)).rejects.toThrow(
      SystemRoleNameAlreadyExistsException,
    );

    expect(roleDomainService.toRoleEntity).not.toHaveBeenCalled();
    expect(roleRepository.save).not.toHaveBeenCalled();
  });
});
