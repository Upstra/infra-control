import { CreateFullPermissionVmUseCase } from '../create-full-permission-vm.use-case';
import { PermissionDomainVmService } from '@/modules/permissions/domain/services/permission.domain.vm.service';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';

describe('CreateFullPermissionVmUseCase', () => {
  let useCase: CreateFullPermissionVmUseCase;
  let domainService: jest.Mocked<PermissionDomainVmService>;
  let repository: jest.Mocked<PermissionVmRepository>;

  const mockPermissionVm = (
    overrides?: Partial<PermissionVm>,
  ): PermissionVm => {
    const base: Partial<PermissionVm> = {
      roleId: 'role-vm',
      vmId: 'vm-42',
      allowRead: true,
      allowWrite: true,
      ...overrides,
    };
    return Object.setPrototypeOf(base, PermissionVm.prototype) as PermissionVm;
  };

  beforeEach(() => {
    domainService = {
      createFullPermissionEntity: jest.fn(),
      createReadOnlyPermissionEntity: jest.fn(),
    } as any;

    repository = {
      save: jest.fn(),
    } as any;

    useCase = new CreateFullPermissionVmUseCase(repository, domainService);
  });

  it('should return a full permission vm dto', async () => {
    const entity = mockPermissionVm();
    domainService.createFullPermissionEntity.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await useCase.execute();

    expect(domainService.createFullPermissionEntity).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(PermissionVmDto.fromEntity(entity));
  });

  it('should propagate repository error', async () => {
    const entity = mockPermissionVm();
    domainService.createFullPermissionEntity.mockReturnValue(entity);
    repository.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute()).rejects.toThrow('DB Error');
  });

  it('should map entity to dto correctly', async () => {
    const saved = mockPermissionVm({
      roleId: 'r2',
      vmId: 'v2',
      allowRead: true,
      allowWrite: true,
    });

    domainService.createFullPermissionEntity.mockReturnValue(saved);
    repository.save.mockResolvedValue(saved);

    const result = await useCase.execute();

    expect(result).toEqual({
      roleId: 'r2',
      vmId: 'v2',
      allowRead: true,
      allowWrite: true,
    });
  });
});
