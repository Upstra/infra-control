import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { VmwareService } from '../vmware.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';

describe('VmwareService', () => {
  let service: VmwareService;
  let pythonExecutor: jest.Mocked<PythonExecutorService>;

  const mockConnection: VmwareConnectionDto = {
    host: '192.168.1.10',
    user: 'admin',
    password: 'password123',
    port: 443,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmwareService,
        {
          provide: PythonExecutorService,
          useValue: {
            executePython: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VmwareService>(VmwareService);
    pythonExecutor = module.get(PythonExecutorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listVMs', () => {
    it('should return list of VMs', async () => {
      const mockResult = {
        vms: [
          {
            moid: 'vm-123',
            name: 'Test VM',
            powerState: 'poweredOn',
            guestOS: 'Ubuntu Linux (64-bit)',
            ipAddress: '192.168.1.100',
          },
        ],
      };

      pythonExecutor.executePython.mockResolvedValue(mockResult);

      const result = await service.listVMs(mockConnection);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        moid: 'vm-123',
        name: 'Test VM',
        powerState: 'poweredOn',
        guestOS: 'Ubuntu Linux (64-bit)',
        ipAddress: '192.168.1.100',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.py', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });

    it('should handle authentication errors', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await expect(service.listVMs(mockConnection)).rejects.toThrow(
        new HttpException(
          'Invalid VMware credentials',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should handle empty VM list', async () => {
      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      const result = await service.listVMs(mockConnection);

      expect(result).toEqual([]);
    });

    it('should include port argument when port is not 443', async () => {
      const customPortConnection = {
        ...mockConnection,
        port: 8443,
      };

      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(customPortConnection);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.py', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
        '--port',
        '8443',
      ]);
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
        ipAddress: '192.168.1.100',
        numCpu: 4,
        memoryMB: 8192,
      };

      pythonExecutor.executePython.mockResolvedValue(mockMetrics);

      const result = await service.getVMMetrics('vm-123', mockConnection);

      expect(result).toEqual(mockMetrics);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'vm_metrics.py',
        [
          '--moid',
          'vm-123',
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
        ],
      );
    });

    it('should handle VM not found error', async () => {
      pythonExecutor.executePython.mockRejectedValue(new Error('VM not found'));

      await expect(
        service.getVMMetrics('vm-999', mockConnection),
      ).rejects.toThrow(
        new HttpException('Resource not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('controlVMPower', () => {
    it('should power on VM successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        message: 'VM powered on successfully',
      });

      const result = await service.controlVMPower(
        'vm-123',
        'on',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM powered on successfully',
        newState: 'poweredOn',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('turn_on.py', [
        '--moid',
        'vm-123',
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });

    it('should power off VM successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        message: 'VM powered off successfully',
      });

      const result = await service.controlVMPower(
        'vm-123',
        'off',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM powered off successfully',
        newState: 'poweredOff',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('turn_off.py', [
        '--moid',
        'vm-123',
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });

    it('should handle timeout error', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Operation timeout'),
      );

      await expect(
        service.controlVMPower('vm-123', 'on', mockConnection),
      ).rejects.toThrow(
        new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT),
      );
    });
  });

  describe('migrateVM', () => {
    it('should migrate VM successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        message: 'VM migrated successfully',
        newHost: 'host-456',
      });

      const result = await service.migrateVM(
        'vm-123',
        'host-456',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM migrated successfully',
        newHost: 'host-456',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'migrate_vm.py',
        [
          '--vmMoId',
          'vm-123',
          '--distMoId',
          'host-456',
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
        ],
      );
    });

    it('should handle invalid host target error', async () => {
      const error = new Error('Host not found');
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.migrateVM('vm-123', 'invalid-host', mockConnection),
      ).rejects.toThrow(
        new HttpException('Resource not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should handle insufficient resources error', async () => {
      const error = new Error('Insufficient resources on destination host');
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.migrateVM('vm-123', 'host-456', mockConnection),
      ).rejects.toThrow(
        new HttpException(
          'Insufficient resources on destination host',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle network issues during migration', async () => {
      const error = new Error('Connection timeout during migration');
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.migrateVM('vm-123', 'host-456', mockConnection),
      ).rejects.toThrow(
        new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT),
      );
    });

    it('should handle authentication error during migration', async () => {
      const error = new Error('Authentication failed');
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.migrateVM('vm-123', 'host-456', mockConnection),
      ).rejects.toThrow(
        new HttpException('Invalid VMware credentials', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('getHostMetrics', () => {
    it('should return host metrics', async () => {
      const mockHostMetrics = {
        moid: 'host-123',
        name: 'ESXi-Host-01',
        connectionState: 'connected',
        powerState: 'poweredOn',
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

      pythonExecutor.executePython.mockResolvedValue(mockHostMetrics);

      const result = await service.getHostMetrics('host-123', mockConnection);

      expect(result).toEqual(mockHostMetrics);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_metrics.py',
        [
          '--moid',
          'host-123',
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
        ],
      );
    });
  });

  describe('buildConnectionArgs', () => {
    it('should build connection args without port when default', async () => {
      const connectionWithoutPort = { ...mockConnection };
      delete connectionWithoutPort.port;

      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(connectionWithoutPort);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.py', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });

    it('should include port when not default', async () => {
      const connectionWithCustomPort = { ...mockConnection, port: 8443 };

      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(connectionWithCustomPort);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.py', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
        '--port',
        '8443',
      ]);
    });
  });
});
