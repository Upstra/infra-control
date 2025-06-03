import { GetPermissionsVmByRoleUseCase } from '../get-permission-vm-by-role.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('GetPermissionsVmByRoleUseCase', () => {
  let useCase: GetPermissionsVmByRoleUseCase;
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
      findAllByRole: jest.fn(),
    } as any;

    useCase = new GetPermissionsVmByRoleUseCase(repository);
  });

  it('should return a list of PermissionVmDto for a given role', async () => {
    const entities = [
      mockPermissionVm({ vmId: 'vm-1' }),
      mockPermissionVm({
        vmId: 'vm-2',
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      }),
    ];

    repository.findAllByRole.mockResolvedValue(entities);

    const result = await useCase.execute('role-1');

    expect(repository.findAllByRole).toHaveBeenCalledWith('role-1');
    expect(result).toEqual(entities.map((p) => new PermissionVmDto(p)));
  });

  it('should return an empty array if no permissions found', async () => {
    repository.findAllByRole.mockResolvedValue([]);

    const result = await useCase.execute('empty-role');

    expect(result).toEqual([]);
  });

  it('should throw if repository throws an exception', async () => {
    repository.findAllByRole.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    await expect(useCase.execute('invalid-role')).rejects.toThrow(
      PermissionNotFoundException,
    );
  });
});
