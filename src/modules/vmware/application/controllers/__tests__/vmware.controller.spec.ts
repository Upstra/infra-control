import { Test, TestingModule } from '@nestjs/testing';
import { VmwareController } from '../vmware.controller';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
} from '../../use-cases';
import { VmPowerActionDto, VmPowerAction, VmMigrateDto } from '../../dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';

describe('VmwareController', () => {
  let controller: VmwareController;
  let listVmsUseCase: jest.Mocked<ListVmsUseCase>;
  let getVmMetricsUseCase: jest.Mocked<GetVmMetricsUseCase>;
  let controlVmPowerUseCase: jest.Mocked<ControlVmPowerUseCase>;
  let migrateVmUseCase: jest.Mocked<MigrateVmUseCase>;
  let getHostMetricsUseCase: jest.Mocked<GetHostMetricsUseCase>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VmwareController],
      providers: [
        {
          provide: ListVmsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetVmMetricsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ControlVmPowerUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: MigrateVmUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetHostMetricsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VmwareController>(VmwareController);
    listVmsUseCase = module.get(ListVmsUseCase);
    getVmMetricsUseCase = module.get(GetVmMetricsUseCase);
    controlVmPowerUseCase = module.get(ControlVmPowerUseCase);
    migrateVmUseCase = module.get(MigrateVmUseCase);
    getHostMetricsUseCase = module.get(GetHostMetricsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listVMs', () => {
    it('should return list of VMs', async () => {
      const mockResult = {
        vms: [
          {
            moid: 'vm-123',
            name: 'Test VM',
            ip: '192.168.1.100',
            guestOs: 'Ubuntu Linux (64-bit)',
            guestFamily: 'linuxGuest',
            version: 'vmx-15',
            createDate: '2023-01-01T00:00:00.000Z',
            numCoresPerSocket: 2,
            numCPU: 4,
            esxiHostName: 'ESXi-Host-01',
            esxiHostMoid: 'host-123',
          },
        ],
      };

      listVmsUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.listVMs('server-1', mockUser);

      expect(result).toEqual(mockResult);
      expect(listVmsUseCase.execute).toHaveBeenCalledWith({
        serverId: 'server-1',
        user: mockUser,
      });
    });
  });

  describe('getVMMetrics', () => {
    it('should return VM metrics', async () => {
      const mockMetrics = {
        powerState: 'poweredOn' as const,
        guestState: 'running' as const,
        connectionState: 'connected' as const,
        guestHeartbeatStatus: 'green' as const,
        overallStatus: 'green' as const,
        maxCpuUsage: 2400,
        maxMemoryUsage: 8192,
        bootTime: '2023-01-01T00:00:00.000Z',
        isMigrating: false,
        overallCpuUsage: 1500,
        guestMemoryUsage: 4096,
        uptimeSeconds: 86400,
        swappedMemory: 0,
        usedStorage: 53687091200,
        totalStorage: 107374182400,
      };

      getVmMetricsUseCase.execute.mockResolvedValue(mockMetrics);

      const result = await controller.getVMMetrics('server-1', 'vm-123', mockUser);

      expect(result).toEqual(mockMetrics);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith({
        serverId: 'server-1',
        vmName: 'vm-123',
        user: mockUser,
      });
    });
  });

  describe('controlVMPower', () => {
    it('should control VM power state', async () => {
      const powerActionDto: VmPowerActionDto = {
        action: VmPowerAction.POWER_ON,
      };

      const mockResult = {
        success: true,
        message: 'VM powered on successfully',
        newState: 'poweredOn',
      };

      controlVmPowerUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.controlVMPower(
        'server-1',
        'vm-123',
        powerActionDto,
        mockUser,
      );

      expect(result).toEqual(mockResult);
      expect(controlVmPowerUseCase.execute).toHaveBeenCalledWith({
        serverId: 'server-1',
        vmName: 'vm-123',
        action: VmPowerAction.POWER_ON,
        user: mockUser,
      });
    });
  });

  describe('migrateVM', () => {
    it('should migrate VM to another host', async () => {
      const migrateDto: VmMigrateDto = {
        destinationMoid: 'host-456',
      };

      const mockResult = {
        success: true,
        message: 'VM migrated successfully',
        newHost: 'host-456',
      };

      migrateVmUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.migrateVM(
        'server-1',
        'vm-123',
        migrateDto,
        mockUser,
      );

      expect(result).toEqual(mockResult);
      expect(migrateVmUseCase.execute).toHaveBeenCalledWith({
        serverId: 'server-1',
        vmName: 'vm-123',
        targetHost: 'host-456',
        user: mockUser,
      });
    });
  });

  describe('getHostMetrics', () => {
    it('should return host metrics', async () => {
      const mockMetrics = {
        host_name: 'esxi-host-1',
        cpu_usage_percent: 45.5,
        memory_usage_percent: 62.3,
        memory_total_gb: 128,
        memory_used_gb: 79.7,
        storage_total_gb: 2048,
        storage_used_gb: 1024,
        vm_count: 15,
        power_state: 'PoweredOn',
        connection_state: 'connected',
        uptime_days: 30,
      };

      getHostMetricsUseCase.execute.mockResolvedValue(mockMetrics);

      const result = await controller.getHostMetrics('server-1', mockUser);

      expect(result).toEqual(mockMetrics);
      expect(getHostMetricsUseCase.execute).toHaveBeenCalledWith({
        serverId: 'server-1',
        user: mockUser,
      });
    });

    it('should handle errors when getting host metrics', async () => {
      const error = new Error('Host not configured');
      getHostMetricsUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.getHostMetrics('server-1', mockUser),
      ).rejects.toThrow(error);
    });
  });
});
