import { UpdatePermissionVmUseCase } from '../update-permission-vm.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('UpdatePermissionVmUseCase', () => {
  let useCase: UpdatePermissionVmUseCase;
  let repository: jest.Mocked<PermissionVmRepository>;

  const mockPermissionVm = (
    overrides?: Partial<PermissionVm>,
  ): PermissionVm => {
    const base: Partial<PermissionVm> = {
      roleId: 'role-1',
      vmId: 'vm-1',
      bitmask: PermissionBit.READ,
      ...overrides,
    };
    return Object.setPrototypeOf(base, PermissionVm.prototype) as PermissionVm;
  };

  beforeEach(() => {
    repository = {
      updatePermission: jest.fn(),
    } as any;

    useCase = new UpdatePermissionVmUseCase(repository);
  });

  it('should update permission and return updated dto', async () => {
    const dto = new PermissionVmDto({
      roleId: 'role-1',
      vmId: 'vm-1',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const updated = mockPermissionVm(dto);

    repository.updatePermission.mockResolvedValue(updated);

    const result = await useCase.execute(dto);

    expect(repository.updatePermission).toHaveBeenCalledWith(
      dto.vmId,
      dto.roleId,
      dto.bitmask,
    );

    expect(result).toEqual(new PermissionVmDto(updated));
  });

  it('should throw if repository throws', async () => {
    const dto = new PermissionVmDto({
      roleId: 'invalid-role',
      vmId: 'invalid-vm',
      bitmask: PermissionBit.READ,
    });

    repository.updatePermission.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    await expect(useCase.execute(dto)).rejects.toThrow(
      PermissionNotFoundException,
    );
  });

  it('should return dto with updated fields', async () => {
    const updated = mockPermissionVm({
      roleId: 'admin',
      vmId: 'vm-admin',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    repository.updatePermission.mockResolvedValue(updated);

    const result = await useCase.execute(new PermissionVmDto(updated));

    expect(result).toEqual({
      roleId: 'admin',
      vmId: 'vm-admin',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });
  });
});
