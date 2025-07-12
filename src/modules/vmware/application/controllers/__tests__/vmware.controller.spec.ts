import { Test, TestingModule } from '@nestjs/testing';
import { VmwareController } from '../vmware.controller';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
} from '../../use-cases';
import {
  VmPowerActionDto,
  VmPowerAction,
  VmMigrateDto,
} from '../../dto';
import { VmwareVm, VmwareHost } from '../../../domain/interfaces';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';

describe('VmwareController', () => {
  let controller: VmwareController;
  let listVmsUseCase: jest.Mocked<ListVmsUseCase>;
  let getVmMetricsUseCase: jest.Mocked<GetVmMetricsUseCase>;
  let controlVmPowerUseCase: jest.Mocked<ControlVmPowerUseCase>;
  let migrateVmUseCase: jest.Mocked<MigrateVmUseCase>;
  let getHostMetricsUseCase: jest.Mocked<GetHostMetricsUseCase>;

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
      .useValue({ canActivate: () => true })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: () => true })
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

      const result = await controller.getVMMetrics('server-1', 'vm-123');

      expect(result).toEqual(mockMetrics);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith('server-1', 'vm-123');
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

      const result = await controller.controlVMPower(
        'server-1',
        'vm-123',
        dto,
      );

      expect(result).toEqual(mockResult);
      expect(controlVmPowerUseCase.execute).toHaveBeenCalledWith('server-1', 'vm-123', 'on');
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

      const result = await controller.migrateVM(
        'server-1',
        'vm-123',
        dto,
      );

      expect(result).toEqual(mockResult);
      expect(migrateVmUseCase.execute).toHaveBeenCalledWith('server-1', 'vm-123', 'host-456');
    });
  });

  describe('getHostMetrics', () => {
    it('should return host metrics', async () => {
      const mockMetrics: VmwareHost = {
        name: 'esxi-host-1',
        ip: '192.168.1.100',
        powerState: 'poweredOn',
        vCenterIp: '192.168.1.10',
        overallStatus: 'green',
        cpuCores: 24,
        ramTotal: 131072,
        rebootRequired: false,
        cpuUsageMHz: 12000,
        ramUsageMB: 65536,
        uptime: 864000,
        boottime: '2023-01-01T00:00:00.000Z',
        cluster: 'Production-Cluster',
        cpuHz: 2400000000,
        numCpuCores: 12,
        numCpuThreads: 24,
        model: 'ProLiant DL380 Gen10',
        vendor: 'HPE',
        biosVendor: 'HPE',
        firewall: 'enabled',
        maxHostRunningVms: 1024,
        maxHostSupportedVcpus: 4096,
        maxMemMBPerFtVm: 131072,
        maxNumDisksSVMotion: 248,
        maxRegisteredVMs: 2048,
        maxRunningVMs: 1024,
        maxSupportedVcpus: 4096,
        maxSupportedVmMemory: 6128640,
        maxVcpusPerFtVm: 8,
        quickBootSupported: true,
        rebootSupported: true,
        shutdownSupported: true,
      };

      getHostMetricsUseCase.execute.mockResolvedValue(mockMetrics);

      const result = await controller.getHostMetrics('server-1');

      expect(result).toEqual(mockMetrics);
      expect(getHostMetricsUseCase.execute).toHaveBeenCalledWith('server-1');
    });

    it('should handle getHostMetrics errors', async () => {
      getHostMetricsUseCase.execute.mockRejectedValue(
        new Error('VMware connection failed'),
      );

      await expect(
        controller.getHostMetrics('server-1'),
      ).rejects.toThrow('VMware connection failed');
    });
  });
});