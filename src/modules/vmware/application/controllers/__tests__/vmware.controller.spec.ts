import { Test, TestingModule } from '@nestjs/testing';
import { VmwareController } from '../vmware.controller';
import {
  ListVmsUseCase,
  GetVmMetricsUseCase,
  ControlVmPowerUseCase,
  MigrateVmUseCase,
  GetHostMetricsUseCase,
} from '../../use-cases';
import { VmwareConnectionDto, VmPowerActionDto, VmPowerAction, VmMigrateDto } from '../../dto';

describe('VmwareController', () => {
  let controller: VmwareController;
  let listVmsUseCase: jest.Mocked<ListVmsUseCase>;
  let getVmMetricsUseCase: jest.Mocked<GetVmMetricsUseCase>;
  let controlVmPowerUseCase: jest.Mocked<ControlVmPowerUseCase>;
  let migrateVmUseCase: jest.Mocked<MigrateVmUseCase>;
  let getHostMetricsUseCase: jest.Mocked<GetHostMetricsUseCase>;

  const mockConnection: VmwareConnectionDto = {
    host: '192.168.1.10',
    user: 'admin',
    password: 'password123',
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
    }).compile();

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
            powerState: 'poweredOn' as const,
            guestOS: 'Ubuntu Linux (64-bit)',
          },
        ],
      };

      listVmsUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.listVMs(mockConnection);

      expect(result).toEqual(mockResult);
      expect(listVmsUseCase.execute).toHaveBeenCalledWith(mockConnection);
    });
  });

  describe('getVMMetrics', () => {
    it('should return VM metrics', async () => {
      const mockMetrics = {
        vmName: 'Test VM',
        powerState: 'poweredOn',
        cpuUsageMhz: 1500,
        memoryUsageMB: 4096,
        storageUsageGB: 50.5,
        uptimeSeconds: 86400,
        guestOS: 'Ubuntu Linux (64-bit)',
        toolsStatus: 'toolsOk',
        numCpu: 4,
        memoryMB: 8192,
      };

      getVmMetricsUseCase.execute.mockResolvedValue(mockMetrics);

      const result = await controller.getVMMetrics('vm-123', mockConnection);

      expect(result).toEqual(mockMetrics);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith('vm-123', mockConnection);
    });
  });

  describe('controlVMPower', () => {
    it('should control VM power state', async () => {
      const powerActionDto: VmPowerActionDto = {
        action: VmPowerAction.ON,
        connection: mockConnection,
      };

      const mockResult = {
        success: true,
        message: 'VM powered on successfully',
        newState: 'poweredOn',
      };

      controlVmPowerUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.controlVMPower('vm-123', powerActionDto);

      expect(result).toEqual(mockResult);
      expect(controlVmPowerUseCase.execute).toHaveBeenCalledWith('vm-123', powerActionDto);
    });
  });

  describe('migrateVM', () => {
    it('should migrate VM to another host', async () => {
      const migrateDto: VmMigrateDto = {
        destinationMoid: 'host-456',
        connection: mockConnection,
      };

      const mockResult = {
        success: true,
        message: 'VM migrated successfully',
        newHost: 'host-456',
      };

      migrateVmUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.migrateVM('vm-123', migrateDto);

      expect(result).toEqual(mockResult);
      expect(migrateVmUseCase.execute).toHaveBeenCalledWith('vm-123', migrateDto);
    });
  });

  describe('getHostMetrics', () => {
    it('should return host metrics', async () => {
      const mockHostMetrics = {
        moid: 'host-123',
        name: 'ESXi-Host-01',
        connectionState: 'connected' as const,
        powerState: 'poweredOn' as const,
        cpuInfo: {
          model: 'Intel Xeon E5-2680',
          cores: 16,
          threads: 32,
          mhz: 2400,
        },
        memoryInfo: {
          totalMB: 131072,
          usedMB: 65536,
          freeMB: 65536,
        },
        uptimeSeconds: 432000,
      };

      getHostMetricsUseCase.execute.mockResolvedValue(mockHostMetrics);

      const result = await controller.getHostMetrics('host-123', mockConnection);

      expect(result).toEqual(mockHostMetrics);
      expect(getHostMetricsUseCase.execute).toHaveBeenCalledWith('host-123', mockConnection);
    });
  });
});