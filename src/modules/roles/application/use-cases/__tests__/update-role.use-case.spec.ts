import { createMockRole } from '@/modules/roles/__mocks__/role.mock';
import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { RoleUpdateDto } from '../../dto/role.update.dto';
import { UpdateRoleUseCase } from '../update-role.use-case';
import { RoleDomainService } from '@/modules/roles/domain/services/role.domain.service';

describe('UpdateRoleUseCase', () => {
  let useCase: UpdateRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;
  let roleDomainService: jest.Mocked<RoleDomainService>;

  beforeEach(() => {
    roleRepository = {
      findOneByField: jest.fn(),
      save: jest.fn(),
    } as any;

    roleDomainService = {
      updateRoleEntity: jest.fn(),
    } as any;

    useCase = new UpdateRoleUseCase(roleRepository, roleDomainService);
  });

  it('should update and return RoleResponseDto', async () => {
    const dto: RoleUpdateDto = { name: 'NEW_NAME' };
    const entity = createMockRole({ name: 'OLD' });
    const updated = createMockRole({ name: 'NEW_NAME' });
    roleRepository.findOneByField.mockResolvedValue(entity);
    roleDomainService.updateRoleEntity.mockReturnValue(updated);
    roleRepository.save.mockResolvedValue(updated);

    const result = await useCase.execute('role-id-123', dto);

    expect(roleRepository.findOneByField).toHaveBeenCalledWith({
      field: 'id',
      value: 'role-id-123',
    });
    expect(roleDomainService.updateRoleEntity).toHaveBeenCalledWith(
      entity,
      dto,
    );
    expect(roleRepository.save).toHaveBeenCalledWith(updated);
    expect(result.name).toBe('NEW_NAME');
  });

  it('should throw if repository throws', async () => {
    roleRepository.findOneByField.mockRejectedValue(new Error('Failed'));
    await expect(useCase.execute('role-id', { name: 'fail' })).rejects.toThrow(
      'Failed',
    );
  });
});
