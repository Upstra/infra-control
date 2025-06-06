import { CreatePermissionVmUseCase } from '../create-permission-vm.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('CreatePermissionVmUseCase', () => {
  let useCase: CreatePermissionVmUseCase;
  let repository: jest.Mocked<PermissionVmRepository>;

  const mockPermissionVm = (
    overrides?: Partial<PermissionVm>,
  ): PermissionVm => {
    const base: Partial<PermissionVm> = {
      roleId: 'role-vm',
      vmId: 'vm-10',
      bitmask: PermissionBit.READ,
      ...overrides,
    };
    return Object.setPrototypeOf(base, PermissionVm.prototype) as PermissionVm;
  };

  beforeEach(() => {
    repository = {
      createPermission: jest.fn(),
    } as any;

    useCase = new CreatePermissionVmUseCase(repository);
  });

  it('should create permission and return dto', async () => {
    const dto = new PermissionVmDto({
      roleId: 'role-vm',
      vmId: 'vm-10',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const permission = mockPermissionVm(dto);

    repository.createPermission.mockResolvedValue(permission);

    const result = await useCase.execute(dto);

    expect(repository.createPermission).toHaveBeenCalledWith(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );

    expect(result).toEqual(new PermissionVmDto(permission));
  });

  it('should throw if repository fails', async () => {
    const dto = new PermissionVmDto({
      roleId: 'invalid-role',
      vmId: 'invalid-vm',
      bitmask: PermissionBit.READ,
    });

    repository.createPermission.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB error');
  });

  it('should map returned entity to dto correctly', async () => {
    const permission = mockPermissionVm({
      roleId: 'role-x',
      vmId: 'vm-x',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    repository.createPermission.mockResolvedValue(permission);

    const result = await useCase.execute(new PermissionVmDto(permission));

    expect(result).toEqual(new PermissionVmDto(permission));
  });
});
