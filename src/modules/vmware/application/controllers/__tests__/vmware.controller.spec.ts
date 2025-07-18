import { Test, TestingModule } from '@nestjs/testing';
import { VmwareController } from '../vmware.controller';
import {
  ListVmsUseCase,
  ListServersUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  StartVMDiscoveryUseCase,
  GetActiveDiscoverySessionUseCase,
  GetDiscoverySessionUseCase,
  ExecuteMigrationPlanUseCase,
  ExecuteRestartPlanUseCase,
  GetMigrationStatusUseCase,
  ClearMigrationDataUseCase,
  SyncServerVmwareDataUseCase,
} from '../../use-cases';
import {
  VmPowerActionDto,
  VmPowerAction,
  VmMigrateDto,
  VmwareConnectionDto,
} from '../../dto';
import { VmwareVm, VmwareHost, VmwareServer } from '../../../domain/interfaces';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';

describe('VmwareController', () => {
  let controller: VmwareController;
  let listVmsUseCase: jest.Mocked<ListVmsUseCase>;
  let listServersUseCase: jest.Mocked<ListServersUseCase>;
  let getVmMetricsUseCase: jest.Mocked<GetVmMetricsUseCase>;
  let controlVmPowerUseCase: jest.Mocked<ControlVmPowerUseCase>;
  let migrateVmUseCase: jest.Mocked<MigrateVmUseCase>;
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
          provide: ListServersUseCase,
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
          provide: StartVMDiscoveryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetActiveDiscoverySessionUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetDiscoverySessionUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExecuteMigrationPlanUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ExecuteRestartPlanUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMigrationStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ClearMigrationDataUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SyncServerVmwareDataUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VmwareController>(VmwareController);
    listVmsUseCase = module.get(ListVmsUseCase);
    listServersUseCase = module.get(ListServersUseCase);
    getVmMetricsUseCase = module.get(GetVmMetricsUseCase);
    controlVmPowerUseCase = module.get(ControlVmPowerUseCase);
    migrateVmUseCase = module.get(MigrateVmUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listVMs', () => {
    it('should return list of VMs', async () => {
      const mockVms: VmwareVm[] = [
        {
          moid: 'vm-123',
          name: 'Test VM',
          ip: '192.168.1.10',
          guestOs: 'Ubuntu Linux (64-bit)',
          guestFamily: 'linuxGuest',
          version: 'vmx-19',
          createDate: '2023-01-01T00:00:00.000Z',
          numCoresPerSocket: 2,
          numCPU: 4,
          esxiHostName: 'esxi-host-1',
          esxiHostMoid: 'host-10',
        },
      ];

      listVmsUseCase.execute.mockResolvedValue({ vms: mockVms });

      const result = await controller.listVMs('server-1');

      expect(result).toEqual({ vms: mockVms });
      expect(listVmsUseCase.execute).toHaveBeenCalledWith('server-1');
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

      const result = await controller.getVMMetrics('server-1', 'vm-123', {
        force: false,
      });

      expect(result).toEqual(mockMetrics);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        'vm-123',
        false,
      );
    });
  });

  describe('controlVMPower', () => {
    it('should control VM power state', async () => {
      const dto: VmPowerActionDto = {
        action: VmPowerAction.POWER_ON,
      };

      const mockResult = {
        success: true,
        message: 'VM powered on successfully',
        newState: 'poweredOn',
      };

      controlVmPowerUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.controlVMPower('server-1', 'vm-123', dto);

      expect(result).toEqual(mockResult);
      expect(controlVmPowerUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        'vm-123',
        'on',
      );
    });
  });

  describe('migrateVM', () => {
    it('should migrate VM to another host', async () => {
      const dto: VmMigrateDto = {
        destinationMoid: 'host-456',
      };

      const mockResult = {
        success: true,
        message: 'VM migration initiated',
        newHost: 'esxi-host-2',
      };

      migrateVmUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.migrateVM('server-1', 'vm-123', dto);

      expect(result).toEqual(mockResult);
      expect(migrateVmUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        'vm-123',
        'host-456',
      );
    });
  });

  describe('listServers', () => {
    it('should return list of servers', async () => {
      const mockConnection: VmwareConnectionDto = {
        host: '192.168.1.10',
        user: 'admin',
        password: 'password123',
        port: 443,
      };

      const mockServers: VmwareServer[] = [
        {
          name: 'esxi-server-01',
          vCenterIp: '192.168.1.5',
          cluster: 'Production-Cluster',
          vendor: 'HP',
          model: 'ProLiant DL380 Gen10',
          ip: '192.168.1.10',
          moid: 'host-123',
          cpuCores: 16,
          cpuThreads: 32,
          cpuMHz: 2400,
          ramTotal: 64,
        },
        {
          name: 'esxi-server-02',
          vCenterIp: '192.168.1.5',
          cluster: 'Production-Cluster',
          vendor: 'Dell Inc.',
          model: 'PowerEdge R740',
          ip: '192.168.1.11',
          moid: 'host-456',
          cpuCores: 24,
          cpuThreads: 48,
          cpuMHz: 2600,
          ramTotal: 128,
        },
      ];

      listServersUseCase.execute.mockResolvedValue(mockServers);

      const result = await controller.listServers(mockConnection);

      expect(result).toEqual({ servers: mockServers });
      expect(listServersUseCase.execute).toHaveBeenCalledWith(mockConnection);
    });

    it('should handle empty server list', async () => {
      const mockConnection: VmwareConnectionDto = {
        host: '192.168.1.10',
        user: 'admin',
        password: 'password123',
      };

      listServersUseCase.execute.mockResolvedValue([]);

      const result = await controller.listServers(mockConnection);

      expect(result).toEqual({ servers: [] });
      expect(listServersUseCase.execute).toHaveBeenCalledWith(mockConnection);
    });

    it('should handle authentication errors', async () => {
      const mockConnection: VmwareConnectionDto = {
        host: '192.168.1.10',
        user: 'admin',
        password: 'wrong-password',
        port: 443,
      };

      listServersUseCase.execute.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      await expect(controller.listServers(mockConnection)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(listServersUseCase.execute).toHaveBeenCalledWith(mockConnection);
    });
  });
});
