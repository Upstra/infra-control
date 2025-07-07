import { UpdatePermissionVmUseCase } from '../update-permission-vm.use-case';
import { PermissionVmRepository } from '@/modules/permissions/infrastructure/repositories/permission.vm.repository';
import {
  PermissionVmDto,
  UpdatePermissionVmDto,
} from '@/modules/permissions/application/dto/permission.vm.dto';
import { PermissionVm } from '@/modules/permissions/domain/entities/permission.vm.entity';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

describe('UpdatePermissionVmUseCase', () => {
  let useCase: UpdatePermissionVmUseCase;
  let repository: jest.Mocked<PermissionVmRepository>;
  let logHistoryMock: jest.Mocked<LogHistoryUseCase>;

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
      findPermissionByIds: jest.fn(),
    } as any;

    logHistoryMock = {
      executeStructured: jest.fn(),
    } as any;

    useCase = new UpdatePermissionVmUseCase(repository, logHistoryMock);
  });

  it('should update permission and return updated dto', async () => {
    const vmId = 'vm-1';
    const roleId = 'role-1';
    const updateDto = new UpdatePermissionVmDto({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
    });

    const oldPermission = mockPermissionVm({
      vmId,
      roleId,
      bitmask: PermissionBit.READ,
    });
    const updated = mockPermissionVm({
      vmId,
      roleId,
      bitmask: updateDto.bitmask,
    });

    repository.findPermissionByIds.mockResolvedValue(oldPermission);
    repository.updatePermission.mockResolvedValue(updated);

    const result = await useCase.execute(vmId, roleId, updateDto, 'user-id');

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

    const oldPermission = mockPermissionVm({ vmId, roleId });
    repository.findPermissionByIds.mockResolvedValue(oldPermission);
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

    const oldPermission = mockPermissionVm({ vmId, roleId });
    const updated = mockPermissionVm({
      roleId,
      vmId,
      bitmask: updateDto.bitmask,
    });

    repository.findPermissionByIds.mockResolvedValue(oldPermission);
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
      {
        bitmask:
          PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE,
      },
      { bitmask: 255 },
    ];

    for (const testCase of testCases) {
      const updateDto = new UpdatePermissionVmDto({
        bitmask: testCase.bitmask,
      });
      const oldPermission = mockPermissionVm({ vmId, roleId });
      const updated = mockPermissionVm({
        vmId,
        roleId,
        bitmask: testCase.bitmask,
      });

      repository.findPermissionByIds.mockResolvedValue(oldPermission);
      repository.updatePermission.mockResolvedValue(updated);

      const result = await useCase.execute(vmId, roleId, updateDto);

      expect(result.bitmask).toBe(testCase.bitmask);
      expect(repository.updatePermission).toHaveBeenCalledWith(
        vmId,
        roleId,
        testCase.bitmask,
      );
    }
  });
});
