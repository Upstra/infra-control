import { CreateReadOnlyPermissionVmUseCase } from '../create-readonly-permission-vm.use-case';
import { PermissionDomainVmService } from '@/modules/permissions/domain/services/permission.domain.vm.service';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

describe('CreateReadOnlyPermissionVmUseCase', () => {
  let useCase: CreateReadOnlyPermissionVmUseCase;
  let domainService: jest.Mocked<PermissionDomainVmService>;
  let repository: jest.Mocked<PermissionVmRepository>;

  const mockPermissionVm = (
    overrides?: Partial<PermissionVm>,
  ): PermissionVm => {
    const base: Partial<PermissionVm> = {
      roleId: 'readonly-role',
      vmId: 'readonly-vm',
      allowRead: true,
      allowWrite: false,
      ...overrides,
    };
    return Object.setPrototypeOf(base, PermissionVm.prototype) as PermissionVm;
  };

  beforeEach(() => {
    domainService = {
      createReadOnlyPermissionEntity: jest.fn(),
      createFullPermissionEntity: jest.fn(),
    } as any;

    repository = {
      save: jest.fn(),
    } as any;

    useCase = new CreateReadOnlyPermissionVmUseCase(repository, domainService);
  });

  it('should create and return a readonly permission entity', async () => {
    const permission = mockPermissionVm();
    domainService.createReadOnlyPermissionEntity.mockReturnValue(permission);
    repository.save.mockResolvedValue(permission);

    const result = await useCase.execute();

    expect(domainService.createReadOnlyPermissionEntity).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(permission);
    expect(result).toBe(permission);
  });

  it('should propagate error if repository.save fails', async () => {
    const permission = mockPermissionVm();
    domainService.createReadOnlyPermissionEntity.mockReturnValue(permission);
    repository.save.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute()).rejects.toThrow('DB error');
  });

  it('should return entity with allowWrite=false and allowRead=true', async () => {
    const permission = mockPermissionVm({
      allowRead: true,
      allowWrite: false,
    });

    domainService.createReadOnlyPermissionEntity.mockReturnValue(permission);
    repository.save.mockResolvedValue(permission);

    const result = await useCase.execute();

    expect(result.allowRead).toBe(true);
    expect(result.allowWrite).toBe(false);
  });
});
