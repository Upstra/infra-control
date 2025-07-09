import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermissionVmUseCase } from '../create-permission-vm.use-case';
import { PermissionVmDto } from '../../../dto/permission.vm.dto';
import { PermissionVm } from '../../../../domain/entities/permission.vm.entity';
import { PermissionBit } from '../../../../domain/value-objects/permission-bit.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

describe('CreatePermissionVmUseCase', () => {
  let useCase: CreatePermissionVmUseCase;
  let repository: any;
  let logHistory: jest.Mocked<LogHistoryUseCase>;

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

  beforeEach(async () => {
    const mockRepository = {
      createPermission: jest.fn(),
    };

    const mockLogHistory = {
      executeStructured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionVmUseCase,
        {
          provide: 'PermissionVmRepositoryInterface',
          useValue: mockRepository,
        },
        {
          provide: LogHistoryUseCase,
          useValue: mockLogHistory,
        },
      ],
    }).compile();

    useCase = module.get<CreatePermissionVmUseCase>(CreatePermissionVmUseCase);
    repository = module.get('PermissionVmRepositoryInterface');
    logHistory = module.get(LogHistoryUseCase);
  });

  describe('execute', () => {
    it('should create permission and return dto', async () => {
      const dto = new PermissionVmDto({
        roleId: 'role-vm',
        vmId: 'vm-10',
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      });

      const permission = mockPermissionVm(dto);

      repository.createPermission.mockResolvedValue(permission);

      const result = await useCase.execute(dto, 'user-123');

      expect(repository.createPermission).toHaveBeenCalledWith(
        dto.vmId,
        dto.roleId,
        dto.bitmask,
      );

      expect(result).toEqual(PermissionVmDto.fromEntity(permission));
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'permission_vm',
        entityId: 'vm-10_role-vm',
        action: 'CREATE',
        userId: 'user-123',
        newValue: {
          vmId: permission.vmId,
          roleId: permission.roleId,
          bitmask: permission.bitmask,
        },
        metadata: {
          permissionType: 'vm',
        },
      });
    });

    it('should create permission without userId', async () => {
      const dto = new PermissionVmDto({
        roleId: 'role-123',
        vmId: 'vm-456',
        bitmask: PermissionBit.DELETE,
      });

      const permission = mockPermissionVm(dto);

      repository.createPermission.mockResolvedValue(permission);

      const result = await useCase.execute(dto);

      expect(result).toEqual(PermissionVmDto.fromEntity(permission));
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'permission_vm',
        entityId: 'vm-456_role-123',
        action: 'CREATE',
        userId: 'system',
        newValue: {
          vmId: permission.vmId,
          roleId: permission.roleId,
          bitmask: permission.bitmask,
        },
        metadata: {
          permissionType: 'vm',
        },
      });
    });

    it('should handle different bitmask values', async () => {
      const testCases = [
        { bitmask: 0 },
        { bitmask: PermissionBit.READ },
        { bitmask: PermissionBit.WRITE },
        { bitmask: PermissionBit.DELETE },
        { bitmask: PermissionBit.READ | PermissionBit.WRITE },
        {
          bitmask:
            PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE,
        },
        { bitmask: 127 },
        { bitmask: 255 },
      ];

      for (const testCase of testCases) {
        const dto = new PermissionVmDto({
          roleId: 'role-123',
          vmId: 'vm-456',
          bitmask: testCase.bitmask,
        });

        const permission = mockPermissionVm({ bitmask: testCase.bitmask });

        repository.createPermission.mockResolvedValue(permission);

        const result = await useCase.execute(dto, 'user-789');

        expect(result.bitmask).toBe(testCase.bitmask);
        expect(repository.createPermission).toHaveBeenCalledWith(
          dto.vmId,
          dto.roleId,
          testCase.bitmask,
        );
      }
    });

    it('should throw if repository fails', async () => {
      const dto = new PermissionVmDto({
        roleId: 'invalid-role',
        vmId: 'invalid-vm',
        bitmask: PermissionBit.READ,
      });

      repository.createPermission.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(dto)).rejects.toThrow('DB error');
      expect(logHistory.executeStructured).not.toHaveBeenCalled();
    });

    it('should throw error when logging fails', async () => {
      const dto = new PermissionVmDto({
        roleId: 'role-123',
        vmId: 'vm-456',
        bitmask: PermissionBit.READ,
      });

      const permission = mockPermissionVm(dto);

      repository.createPermission.mockResolvedValue(permission);
      logHistory.executeStructured.mockRejectedValue(
        new Error('Logging failed'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow('Logging failed');
    });

    it('should map returned entity to dto correctly', async () => {
      const permission = mockPermissionVm({
        roleId: 'role-x',
        vmId: 'vm-x',
        bitmask: PermissionBit.READ | PermissionBit.WRITE,
      });

      repository.createPermission.mockResolvedValue(permission);

      const result = await useCase.execute(new PermissionVmDto(permission));

      expect(result).toEqual(PermissionVmDto.fromEntity(permission));
      expect(result.roleId).toBe('role-x');
      expect(result.vmId).toBe('vm-x');
      expect(result.bitmask).toBe(PermissionBit.READ | PermissionBit.WRITE);
    });

    it('should work without LogHistoryUseCase', async () => {
      const mockRepositoryWithoutLogging = {
        createPermission: jest.fn(),
      };

      const moduleWithoutLogging: TestingModule =
        await Test.createTestingModule({
          providers: [
            CreatePermissionVmUseCase,
            {
              provide: 'PermissionVmRepositoryInterface',
              useValue: mockRepositoryWithoutLogging,
            },
            {
              provide: LogHistoryUseCase,
              useValue: undefined,
            },
          ],
        }).compile();

      const useCaseWithoutLogging =
        moduleWithoutLogging.get<CreatePermissionVmUseCase>(
          CreatePermissionVmUseCase,
        );

      const dto = new PermissionVmDto({
        roleId: 'role-123',
        vmId: 'vm-456',
        bitmask: PermissionBit.READ,
      });

      const permission = mockPermissionVm(dto);

      mockRepositoryWithoutLogging.createPermission.mockResolvedValue(
        permission,
      );

      const result = await useCaseWithoutLogging.execute(dto);

      expect(result).toEqual(PermissionVmDto.fromEntity(permission));
    });

    it('should handle undefined values in repository response', async () => {
      const dto = new PermissionVmDto({
        roleId: 'role-123',
        vmId: 'vm-456',
        bitmask: PermissionBit.READ,
      });

      const permission = mockPermissionVm({
        roleId: undefined,
        vmId: undefined,
        bitmask: 0,
      });

      repository.createPermission.mockResolvedValue(permission);

      const result = await useCase.execute(dto);

      expect(result.roleId).toBeUndefined();
      expect(result.vmId).toBeUndefined();
      expect(result.bitmask).toBe(0);
    });

    it('should handle null values from repository', async () => {
      const dto = new PermissionVmDto({
        roleId: 'role-123',
        vmId: 'vm-456',
        bitmask: PermissionBit.READ,
      });

      repository.createPermission.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow();
    });

    it('should validate DTO values are passed correctly to repository', async () => {
      const testCases = [
        { roleId: 'role-1', vmId: 'vm-1', bitmask: 1 },
        { roleId: 'role-2', vmId: 'vm-2', bitmask: 7 },
        { roleId: 'role-3', vmId: 'vm-3', bitmask: 15 },
        { roleId: 'role-special!@#', vmId: 'vm-special$%^', bitmask: 31 },
      ];

      for (const testCase of testCases) {
        const dto = new PermissionVmDto(testCase);
        const permission = mockPermissionVm(testCase);

        repository.createPermission.mockResolvedValue(permission);

        await useCase.execute(dto);

        expect(repository.createPermission).toHaveBeenCalledWith(
          testCase.vmId,
          testCase.roleId,
          testCase.bitmask,
        );
      }
    });
  });
});
