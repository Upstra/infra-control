import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { RoleCreationDto } from '../../dto/role.creation.dto';
import { UpdateRoleUseCase } from '../update-role.use-case';
import { RoleDomainService } from '@/modules/roles/domain/services/role.domain.service';

describe('UpdateRoleUseCase', () => {
  let useCase: UpdateRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let roleDomainService: jest.Mocked<RoleDomainService>;

  beforeEach(() => {
    roleRepository = {
      updateRole: jest.fn(),
    } as any;

    roleDomainService = {
      updateRoleEntity: jest.fn(),
    } as any;

    useCase = new UpdateRoleUseCase(roleRepository, roleDomainService);
  });

  it('should update and return RoleResponseDto', async () => {
    const dto: RoleCreationDto = { name: 'NEW_NAME' };
    const updated = createMockRole({ name: 'NEW_NAME' });
    roleRepository.updateRole.mockResolvedValue(updated);

    const result = await useCase.execute('role-id-123', dto);

    expect(roleRepository.updateRole).toHaveBeenCalledWith(
      'role-id-123',
      'NEW_NAME',
    );
    expect(result.name).toBe('NEW_NAME');
  });

  it('should throw if repository throws', async () => {
    roleRepository.updateRole.mockRejectedValue(new Error('Failed'));
    await expect(useCase.execute('role-id', { name: 'fail' })).rejects.toThrow(
      'Failed',
    );
  });
});
