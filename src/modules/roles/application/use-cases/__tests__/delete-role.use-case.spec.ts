import { RoleRepositoryInterface } from '@/modules/roles/domain/interfaces/role.repository.interface';
import { DeleteRoleUseCase } from '../delete-role.use-case';

describe('DeleteRoleUseCase', () => {
  let useCase: DeleteRoleUseCase;
  let roleRepository: jest.Mocked<RoleRepositoryInterface>;

  beforeEach(() => {
    roleRepository = {
      deleteRole: jest.fn(),
    } as any;

    useCase = new DeleteRoleUseCase(roleRepository);
  });

  it('should call repository to delete role', async () => {
    roleRepository.deleteRole.mockResolvedValue(undefined);

    await useCase.execute('role-id-123');
    expect(roleRepository.deleteRole).toHaveBeenCalledWith('role-id-123');
  });

  it('should propagate errors from repository', async () => {
    roleRepository.deleteRole.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute('role-id-123')).rejects.toThrow('DB Error');
  });
});
