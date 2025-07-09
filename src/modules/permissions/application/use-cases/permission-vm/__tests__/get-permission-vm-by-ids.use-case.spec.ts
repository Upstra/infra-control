import { GetPermissionVmByIdsUseCase } from '../get-permission-vm-by-ids.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

describe('GetPermissionVmByIdsUseCase', () => {
  let useCase: GetPermissionVmByIdsUseCase;
  let repository: jest.Mocked<PermissionVmRepository>;

  const mockPermissionVm = (
    overrides?: Partial<PermissionVm>,
  ): PermissionVm => {
    const base: Partial<PermissionVm> = {
      roleId: 'role-vm',
      vmId: 'vm-1',
      bitmask: PermissionBit.READ,
      ...overrides,
    };
    return Object.setPrototypeOf(base, PermissionVm.prototype) as PermissionVm;
  };

  beforeEach(() => {
    repository = {
      findPermissionByIds: jest.fn(),
    } as any;

    useCase = new GetPermissionVmByIdsUseCase(repository);
  });

  it('should return a PermissionVmDto from found entity', async () => {
    const entity = mockPermissionVm();
    repository.findPermissionByIds.mockResolvedValue(entity);

    const dto = new PermissionVmDto({
      vmId: 'vm-1',
      roleId: 'role-vm',
    });

    const result = await useCase.execute(dto.vmId, dto.roleId);

    expect(repository.findPermissionByIds).toHaveBeenCalledWith(
      'vm-1',
      'role-vm',
    );
    expect(result).toEqual(new PermissionVmDto(entity));
  });

  it('should throw if permission not found', async () => {
    repository.findPermissionByIds.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    const dto = new PermissionVmDto({
      vmId: 'invalid-vm',
      roleId: 'invalid-role',
    });

    await expect(useCase.execute(dto.vmId, dto.roleId)).rejects.toThrow(
      PermissionNotFoundException,
    );
  });

  it('should map correct fields from entity to dto', async () => {
    const permission = mockPermissionVm({
      roleId: 'r2',
      vmId: 'v2',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    repository.findPermissionByIds.mockResolvedValue(permission);

    const result = await useCase.execute('v2', 'r2');

    expect(result).toEqual({
      roleId: 'r2',
      vmId: 'v2',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });
  });
});
