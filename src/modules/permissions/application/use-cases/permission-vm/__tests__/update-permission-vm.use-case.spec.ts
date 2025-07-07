import { UpdatePermissionVmUseCase } from '../update-permission-vm.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import { PermissionVmDto, UpdatePermissionVmDto } from '@/modules/permissions/application/dto/permission.vm.dto';
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
    const vmId = 'vm-1';
    const roleId = 'role-1';
    const updateDto = new UpdatePermissionVmDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const updated = mockPermissionVm({
      vmId,
      roleId,
      bitmask: updateDto.bitmask,
    });

    repository.updatePermission.mockResolvedValue(updated);

    const result = await useCase.execute(vmId, roleId, updateDto);

    expect(repository.updatePermission).toHaveBeenCalledWith(
      vmId,
      roleId,
      updateDto.bitmask,
    );

    expect(result).toEqual(new PermissionVmDto(updated));
  });

  it('should throw if repository throws', async () => {
    const vmId = 'invalid-vm';
    const roleId = 'invalid-role';
    const updateDto = new UpdatePermissionVmDto({
      bitmask: PermissionBit.READ,
    });

    repository.updatePermission.mockRejectedValue(
      new PermissionNotFoundException(),
    );

    await expect(useCase.execute(vmId, roleId, updateDto)).rejects.toThrow(
      PermissionNotFoundException,
    );
  });

  it('should return dto with updated fields', async () => {
    const vmId = 'vm-admin';
    const roleId = 'admin';
    const updateDto = new UpdatePermissionVmDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const updated = mockPermissionVm({
      roleId,
      vmId,
      bitmask: updateDto.bitmask,
    });

    repository.updatePermission.mockResolvedValue(updated);

    const result = await useCase.execute(vmId, roleId, updateDto);

    expect(result).toEqual({
      roleId: 'admin',
      vmId: 'vm-admin',
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });
  });

  it('should handle different bitmask values', async () => {
    const vmId = 'vm-test';
    const roleId = 'role-test';
    const testCases = [
      { bitmask: 0 },
      { bitmask: PermissionBit.READ },
      { bitmask: PermissionBit.WRITE },
      { bitmask: PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE },
      { bitmask: 255 },
    ];

    for (const testCase of testCases) {
      const updateDto = new UpdatePermissionVmDto({ bitmask: testCase.bitmask });
      const updated = mockPermissionVm({ vmId, roleId, bitmask: testCase.bitmask });
      
      repository.updatePermission.mockResolvedValue(updated);
      
      const result = await useCase.execute(vmId, roleId, updateDto);
      
      expect(result.bitmask).toBe(testCase.bitmask);
      expect(repository.updatePermission).toHaveBeenCalledWith(vmId, roleId, testCase.bitmask);
    }
  });
});
