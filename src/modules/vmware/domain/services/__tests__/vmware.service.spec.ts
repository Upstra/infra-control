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
        hostname: undefined,
        numCpu: undefined,
        memoryMB: undefined,
        toolsStatus: undefined,
        annotation: undefined,
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
        powerState: 'poweredOn',
        guestState: 'running',
        connectionState: 'connected',
        guestHeartbeatStatus: 'green',
        overallStatus: 'green',
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

      pythonExecutor.executePython.mockResolvedValue(mockMetrics);

      const result = await service.getVMMetrics('vm-123', mockConnection);

      expect(result).toEqual({
        powerState: 'poweredOn',
        guestState: 'running',
        connectionState: 'connected',
        guestHeartbeatStatus: 'green',
        overallStatus: 'green',
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
      });
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
        result: {
          message: 'VM has been successfully started',
          httpCode: 200,
        },
      });

      const result = await service.controlVMPower(
        'vm-123',
        'on',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM has been successfully started',
        newState: 'poweredOn',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('vm_start.py', [
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
        result: {
          message: 'VM has been successfully stopped',
          httpCode: 200,
        },
      });

      const result = await service.controlVMPower(
        'vm-123',
        'off',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM has been successfully stopped',
        newState: 'poweredOff',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('vm_stop.py', [
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
        result: {
          message: 'VM migrated successfully',
          httpCode: 200,
        },
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
        'vm_migration.py',
        [
          '--vm_moid',
          'vm-123',
          '--dist_moid',
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

    it('should handle error with new JSON format', async () => {
      const error: any = new Error('Action forbidden');
      error.result = { httpCode: 403, message: 'VM is locked' };
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.migrateVM('vm-123', 'host-456', mockConnection),
      ).rejects.toThrow(
        new HttpException('Action forbidden', HttpStatus.FORBIDDEN),
      );
    });
  });

  describe('getServerInfo', () => {
    it('should return server static information', async () => {
      const mockServerInfo = {
        name: 'esxi-server-01',
        vCenterIp: '192.168.1.5',
        cluster: 'Production-Cluster',
        vendor: 'HP',
        model: 'ProLiant DL380 Gen10',
        ip: '192.168.1.10',
        cpuCores: 16,
        cpuThreads: 32,
        cpuMHz: 2400.0,
        ramTotal: 64,
      };

      pythonExecutor.executePython.mockResolvedValue(mockServerInfo);

      const result = await service.getServerInfo('host-123', mockConnection);

      expect(result).toEqual(mockServerInfo);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_info.py',
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

    it('should handle server not found error', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Server not found'),
      );

      await expect(
        service.getServerInfo('host-999', mockConnection),
      ).rejects.toThrow(
        new HttpException('Resource not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getServerMetrics', () => {
    it('should return server dynamic metrics', async () => {
      const mockServerMetrics = {
        powerState: 'poweredOn',
        overallStatus: 'green',
        rebootRequired: false,
        cpuUsagePercent: 15.625,
        ramUsageMB: 32768,
        uptime: 2592000,
        boottime: '2023-11-01T12:00:00.000Z',
      };

      pythonExecutor.executePython.mockResolvedValue(mockServerMetrics);

      const result = await service.getServerMetrics('host-123', mockConnection);

      expect(result).toEqual(mockServerMetrics);
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

    it('should handle authentication error', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await expect(
        service.getServerMetrics('host-123', mockConnection),
      ).rejects.toThrow(
        new HttpException(
          'Invalid VMware credentials',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });
  });

  describe('getHostMetrics', () => {
    it('should return host metrics', async () => {
      const mockHostMetrics = {
        name: 'ESXi-Host-01',
        ip: '192.168.1.100',
        powerState: 'poweredOn',
        vCenterIp: '192.168.1.10',
        overallStatus: 'green',
        cpuCores: 16,
        ramTotal: 131072,
        rebootRequired: false,
        cpuUsageMHz: 12000,
        ramUsageMB: 65536,
        uptime: 432000,
        boottime: '2023-01-01T00:00:00.000Z',
        cluster: 'Production-Cluster',
        cpuHz: 2400000000,
        numCpuCores: 16,
        numCpuThreads: 32,
        model: 'Intel Xeon E5-2680',
        vendor: 'Intel',
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

      pythonExecutor.executePython.mockResolvedValue(mockHostMetrics);

      const result = await service.getHostMetrics('host-123', mockConnection);

      expect(result).toEqual({
        name: 'ESXi-Host-01',
        ip: '192.168.1.100',
        powerState: 'poweredOn',
        vCenterIp: '192.168.1.10',
        overallStatus: 'green',
        cpuCores: 16,
        ramTotal: 131072,
        rebootRequired: false,
        cpuUsageMHz: 12000,
        ramUsageMB: 65536,
        uptime: 432000,
        boottime: '2023-01-01T00:00:00.000Z',
        cluster: 'Production-Cluster',
        cpuHz: 2400000000,
        numCpuCores: 16,
        numCpuThreads: 32,
        model: 'Intel Xeon E5-2680',
        vendor: 'Intel',
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
      });
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
