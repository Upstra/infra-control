import { DeleteRoleUseCase } from '../delete-role.use-case';
import { SafeRoleDeletionDomainService } from '@/modules/roles/domain/services/safe-role-deletion.domain.service';

describe('DeleteRoleUseCase', () => {
  let useCase: DeleteRoleUseCase;
  let safeRoleDeletionService: jest.Mocked<SafeRoleDeletionDomainService>;

  beforeEach(() => {
    safeRoleDeletionService = {
      safelyDeleteRole: jest.fn(),
    } as any;

    useCase = new DeleteRoleUseCase(safeRoleDeletionService);
  });

  it('should call safe deletion service to delete role', async () => {
    safeRoleDeletionService.safelyDeleteRole.mockResolvedValue(undefined);

    await useCase.execute('role-id-123');
    expect(safeRoleDeletionService.safelyDeleteRole).toHaveBeenCalledWith(
      'role-id-123',
    );
  });

  it('should propagate errors from safe deletion service', async () => {
    safeRoleDeletionService.safelyDeleteRole.mockRejectedValue(
      new Error('Service Error'),
    );

    await expect(useCase.execute('role-id-123')).rejects.toThrow(
      'Service Error',
    );
  });
});
