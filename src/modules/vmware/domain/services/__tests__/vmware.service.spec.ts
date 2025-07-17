import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { VmwareService } from '../vmware.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { VmwareCacheService } from '../vmware-cache.service';

describe('VmwareService', () => {
  let service: VmwareService;
  let pythonExecutor: jest.Mocked<PythonExecutorService>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let vmwareCacheService: jest.Mocked<VmwareCacheService>;

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
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findAll: jest.fn(),
            updateServer: jest.fn(),
          },
        },
        {
          provide: VmwareCacheService,
          useValue: {
            getVmMetrics: jest.fn(),
            getServerMetrics: jest.fn(),
            initializeIfNeeded: jest.fn(),
            isVcenterConfigured: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VmwareService>(VmwareService);
    pythonExecutor = module.get(PythonExecutorService);
    serverRepository = module.get('ServerRepositoryInterface');
    vmwareCacheService = module.get(VmwareCacheService);
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
            guestOs: 'Ubuntu Linux (64-bit)',
            guestFamily: 'linuxGuest',
            version: 'vmx-11',
            createDate: '2025-01-14T12:00:00Z',
            numCoresPerSocket: 2,
            esxiHostName: 'esxhost01',
            esxiHostMoid: 'ha-host',
            ip: '192.168.1.100',
            hostname: 'test-vm',
            numCPU: 4,
            memoryMB: 8192,
            toolsStatus: 'toolsOk',
            annotation: 'Test annotation',
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
        guestOs: 'Ubuntu Linux (64-bit)',
        guestFamily: 'linuxGuest',
        version: 'vmx-11',
        createDate: '2025-01-14T12:00:00Z',
        numCoresPerSocket: 2,
        esxiHostName: 'esxhost01',
        esxiHostMoid: 'ha-host',
        ip: '192.168.1.100',
        hostname: 'test-vm',
        numCPU: 4,
        memoryMB: 8192,
        toolsStatus: 'toolsOk',
        annotation: 'Test annotation',
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
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

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
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
    beforeEach(() => {
      serverRepository.findAll.mockResolvedValue([]);
      vmwareCacheService.initializeIfNeeded.mockResolvedValue(undefined);
    });

    it('should return VM metrics from cache when available', async () => {
      const cachedMetrics = {
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

      vmwareCacheService.getVmMetrics.mockResolvedValue(cachedMetrics);

      const result = await service.getVMMetrics('vm-123', mockConnection, false);

      expect(result).toEqual(cachedMetrics);
      expect(vmwareCacheService.getVmMetrics).toHaveBeenCalledWith('vm-123');
      expect(pythonExecutor.executePython).not.toHaveBeenCalled();
    });

    it('should fetch VM metrics from Python when cache is empty', async () => {
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

      vmwareCacheService.getVmMetrics.mockResolvedValue(null);
      pythonExecutor.executePython.mockResolvedValue(mockMetrics);

      const result = await service.getVMMetrics('vm-123', mockConnection, false);

      expect(result).toEqual(mockMetrics);
      expect(vmwareCacheService.getVmMetrics).toHaveBeenCalledWith('vm-123');
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'vm_metrics.sh',
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

    it('should force fetch from Python when force=true', async () => {
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

      const result = await service.getVMMetrics('vm-123', mockConnection, true);

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
        'vm_metrics.sh',
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
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('vm_start.sh', [
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
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('vm_stop.sh', [
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
        'vm_migration.sh',
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
        new HttpException(
          'Invalid VMware credentials',
          HttpStatus.UNAUTHORIZED,
        ),
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
        'server_info.sh',
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
    beforeEach(() => {
      serverRepository.findAll.mockResolvedValue([]);
      vmwareCacheService.initializeIfNeeded.mockResolvedValue(undefined);
    });

    it('should return server metrics from cache when available', async () => {
      const cachedMetrics = {
        powerState: 'poweredOn',
        overallStatus: 'green',
        rebootRequired: false,
        cpuUsagePercent: 15.625,
        ramUsageMB: 32768,
        uptime: 2592000,
        boottime: '2023-11-01T12:00:00.000Z',
      };

      vmwareCacheService.getServerMetrics.mockResolvedValue(cachedMetrics);

      const result = await service.getServerMetrics('host-123', mockConnection, false);

      expect(result).toEqual(cachedMetrics);
      expect(vmwareCacheService.getServerMetrics).toHaveBeenCalledWith('host-123');
      expect(pythonExecutor.executePython).not.toHaveBeenCalled();
    });

    it('should fetch server metrics from Python when cache is empty', async () => {
      const mockServerMetrics = {
        powerState: 'poweredOn',
        overallStatus: 'green',
        rebootRequired: false,
        cpuUsagePercent: 15.625,
        ramUsageMB: 32768,
        uptime: 2592000,
        boottime: '2023-11-01T12:00:00.000Z',
      };

      vmwareCacheService.getServerMetrics.mockResolvedValue(null);
      pythonExecutor.executePython.mockResolvedValue(mockServerMetrics);

      const result = await service.getServerMetrics('host-123', mockConnection, false);

      expect(result).toEqual(mockServerMetrics);
      expect(vmwareCacheService.getServerMetrics).toHaveBeenCalledWith('host-123');
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_metrics.sh',
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

    it('should force fetch from Python when force=true', async () => {
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

      const result = await service.getServerMetrics('host-123', mockConnection, true);

      expect(result).toEqual(mockServerMetrics);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_metrics.sh',
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

  describe('listServers', () => {
    it('should return list of servers', async () => {
      const mockServersResult = {
        servers: [
          {
            name: 'esxi-server-01',
            vCenterIp: '192.168.1.5',
            cluster: 'Production-Cluster',
            vendor: 'HP',
            model: 'ProLiant DL380 Gen10',
            ip: '192.168.1.10',
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
            cpuCores: 24,
            cpuThreads: 48,
            cpuMHz: 2600,
            ramTotal: 128,
          },
        ],
      };

      pythonExecutor.executePython.mockResolvedValue(mockServersResult);

      const result = await service.listServers(mockConnection);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'esxi-server-01',
        vCenterIp: '192.168.1.5',
        cluster: 'Production-Cluster',
        vendor: 'HP',
        model: 'ProLiant DL380 Gen10',
        ip: '192.168.1.10',
        cpuCores: 16,
        cpuThreads: 32,
        cpuMHz: 2400,
        ramTotal: 64,
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'list_server.sh',
        [
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
        ],
      );
    });

    it('should handle empty server list', async () => {
      pythonExecutor.executePython.mockResolvedValue({ servers: [] });

      const result = await service.listServers(mockConnection);

      expect(result).toEqual([]);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'list_server.sh',
        [
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
        ],
      );
    });

    it('should handle error response from script', async () => {
      const errorResult = {
        result: {
          message: 'Invalid credentials',
          httpCode: 401,
        },
      };

      pythonExecutor.executePython.mockResolvedValue(errorResult);

      await expect(service.listServers(mockConnection)).rejects.toThrow(
        new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should handle connection timeout', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Operation timeout'),
      );

      await expect(service.listServers(mockConnection)).rejects.toThrow(
        new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT),
      );
    });

    it('should include port in args when not default', async () => {
      pythonExecutor.executePython.mockResolvedValue({ servers: [] });

      await service.listServers({ ...mockConnection, port: 8443 });

      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'list_server.sh',
        [
          '--ip',
          '192.168.1.10',
          '--user',
          'admin',
          '--password',
          'password123',
          '--port',
          '8443',
        ],
      );
    });

    it('should update existing servers with VMware host MOID sequentially', async () => {
      const mockServersResult = {
        servers: [
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
        ],
      };

      const mockExistingServers = [
        {
          id: 'server-1',
          name: 'Server 1',
          ip: '192.168.1.10',
          vmwareHostMoid: null,
          state: 'stopped',
          adminUrl: 'https://192.168.1.10',
          login: 'admin',
          password: 'password',
          type: 'esxi',
          priority: 1,
          roomId: 'room-1',
        } as any,
        {
          id: 'server-2',
          name: 'Server 2',
          ip: '192.168.1.11',
          vmwareHostMoid: null,
          state: 'stopped',
          adminUrl: 'https://192.168.1.11',
          login: 'admin',
          password: 'password',
          type: 'esxi',
          priority: 1,
          roomId: 'room-1',
        } as any,
        {
          id: 'server-3',
          name: 'Server 3',
          ip: '192.168.1.12',
          vmwareHostMoid: 'existing-moid',
          state: 'stopped',
          adminUrl: 'https://192.168.1.12',
          login: 'admin',
          password: 'password',
          type: 'esxi',
          priority: 1,
          roomId: 'room-1',
        } as any,
      ];

      pythonExecutor.executePython.mockResolvedValue(mockServersResult);
      serverRepository.findAll.mockResolvedValue(mockExistingServers);
      serverRepository.updateServer.mockResolvedValue(null);

      await service.listServers(mockConnection);

      expect(serverRepository.findAll).toHaveBeenCalledTimes(1);
      expect(serverRepository.updateServer).toHaveBeenCalledTimes(2);
      expect(serverRepository.updateServer).toHaveBeenNthCalledWith(
        1,
        'server-1',
        {
          vmwareHostMoid: 'host-123',
        },
      );
      expect(serverRepository.updateServer).toHaveBeenNthCalledWith(
        2,
        'server-2',
        {
          vmwareHostMoid: 'host-456',
        },
      );
    });

    it('should handle server repository errors gracefully', async () => {
      const mockServersResult = {
        servers: [
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
        ],
      };

      pythonExecutor.executePython.mockResolvedValue(mockServersResult);
      serverRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.listServers(mockConnection)).rejects.toThrow(
        new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR),
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
        'server_metrics.sh',
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

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
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

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
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

    it('should not include port when port is 443', async () => {
      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(mockConnection);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing result in response', async () => {
      pythonExecutor.executePython.mockResolvedValue({});

      const result = await service.controlVMPower(
        'vm-123',
        'on',
        mockConnection,
      );

      expect(result).toEqual({
        success: true,
        message: 'VM started successfully',
        newState: 'poweredOn',
      });
    });

    it('should handle missing newHost in migration response', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        result: {
          message: 'VM migrated successfully',
          httpCode: 200,
        },
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
    });

    it('should handle parseVmList with missing fields', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        vms: [
          {
            moid: 'vm-123',
            name: 'Test VM',
          },
          {
            moid: 'vm-456',
          },
        ],
      });

      const result = await service.listVMs(mockConnection);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        moid: 'vm-123',
        name: 'Test VM',
        powerState: undefined,
        guestOs: undefined,
        guestFamily: undefined,
        version: undefined,
        createDate: undefined,
        numCoresPerSocket: undefined,
        esxiHostName: undefined,
        esxiHostMoid: undefined,
        ip: undefined,
        hostname: undefined,
        numCPU: undefined,
        memoryMB: undefined,
        toolsStatus: undefined,
        annotation: undefined,
      });
    });

    it('should handle parseVmMetrics with null values', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        powerState: null,
        guestState: null,
        connectionState: null,
        guestHeartbeatStatus: null,
        overallStatus: null,
        maxCpuUsage: null,
        maxMemoryUsage: null,
        bootTime: null,
        isMigrating: null,
        overallCpuUsage: null,
        guestMemoryUsage: null,
        uptimeSeconds: null,
        swappedMemory: null,
        usedStorage: null,
        totalStorage: null,
      });

      const result = await service.getVMMetrics('vm-123', mockConnection);

      expect(result).toEqual({
        powerState: 'poweredOff',
        guestState: 'unknown',
        connectionState: 'disconnected',
        guestHeartbeatStatus: 'gray',
        overallStatus: 'gray',
        maxCpuUsage: 0,
        maxMemoryUsage: 0,
        bootTime: '',
        isMigrating: false,
        overallCpuUsage: 0,
        guestMemoryUsage: 0,
        uptimeSeconds: 0,
        swappedMemory: 0,
        usedStorage: 0,
        totalStorage: 0,
      });
    });

    it('should handle parseServerInfo with missing fields', async () => {
      pythonExecutor.executePython.mockResolvedValue({});

      const result = await service.getServerInfo('host-123', mockConnection);

      expect(result).toEqual({
        name: 'Unknown',
        vCenterIp: '',
        cluster: '',
        vendor: 'Unknown',
        model: 'Unknown',
        ip: '',
        cpuCores: 0,
        cpuThreads: 0,
        cpuMHz: 0,
        ramTotal: 0,
      });
    });

    it('should handle parseServerMetrics with missing fields', async () => {
      pythonExecutor.executePython.mockResolvedValue({});

      const result = await service.getServerMetrics('host-123', mockConnection);

      expect(result).toEqual({
        powerState: 'poweredOff',
        overallStatus: 'gray',
        rebootRequired: false,
        cpuUsagePercent: 0,
        ramUsageMB: 0,
        uptime: 0,
        boottime: '',
      });
    });

    it('should handle parseHostMetrics with default values', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        name: 'Test Host',
        ip: '192.168.1.1',
        vCenterIp: '192.168.1.5',
      });

      const result = await service.getHostMetrics('host-123', mockConnection);

      expect(result).toEqual({
        name: 'Test Host',
        ip: '192.168.1.1',
        powerState: 'poweredOff',
        vCenterIp: '192.168.1.5',
        overallStatus: 'gray',
        cpuCores: 0,
        ramTotal: 0,
        rebootRequired: false,
        cpuUsageMHz: 0,
        ramUsageMB: 0,
        uptime: 0,
        boottime: '',
        cluster: '',
        cpuHz: 0,
        numCpuCores: 0,
        numCpuThreads: 0,
        model: 'Unknown',
        vendor: 'Unknown',
        biosVendor: 'Unknown',
        firewall: 'Unknown',
        maxHostRunningVms: 0,
        maxHostSupportedVcpus: 0,
        maxMemMBPerFtVm: 0,
        maxNumDisksSVMotion: 0,
        maxRegisteredVMs: 0,
        maxRunningVMs: 0,
        maxSupportedVcpus: 0,
        maxSupportedVmMemory: 0,
        maxVcpusPerFtVm: 0,
        quickBootSupported: false,
        rebootSupported: false,
        shutdownSupported: false,
      });
    });

    it('should handle error when empty password provided', async () => {
      const connectionWithEmptyPassword = {
        ...mockConnection,
        password: '',
      };

      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(connectionWithEmptyPassword);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        '',
      ]);
    });

    it('should log debug information when building connection args', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');
      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(mockConnection);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Building connection args for 192.168.1.10:',
      );
      expect(loggerSpy).toHaveBeenCalledWith('- User: admin');
      expect(loggerSpy).toHaveBeenCalledWith('- Password exists: true');
      expect(loggerSpy).toHaveBeenCalledWith('- Password length: 11');
    });

    it('should log when no VMs found', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn');
      pythonExecutor.executePython.mockResolvedValue(null);

      const result = await service.listVMs(mockConnection);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Invalid result format or empty vms array',
      );
      expect(result).toEqual([]);
    });

    it('should log when parsing VMs', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');
      pythonExecutor.executePython.mockResolvedValue({
        vms: [{ moid: 'vm-1' }, { moid: 'vm-2' }],
      });

      await service.listVMs(mockConnection);

      expect(loggerSpy).toHaveBeenCalledWith('Found 2 VMs to parse');
      expect(loggerSpy).toHaveBeenCalledWith('Parsed 2 VMs');
    });

    it('should handle generic error appropriately', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Unknown error'),
      );

      await expect(service.listVMs(mockConnection)).rejects.toThrow(
        new HttpException('Unknown error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should handle connection with undefined port', async () => {
      const connectionWithUndefinedPort = {
        ...mockConnection,
        port: undefined,
      };

      pythonExecutor.executePython.mockResolvedValue({ vms: [] });

      await service.listVMs(connectionWithUndefinedPort);

      expect(pythonExecutor.executePython).toHaveBeenCalledWith('list_vm.sh', [
        '--ip',
        '192.168.1.10',
        '--user',
        'admin',
        '--password',
        'password123',
      ]);
    });
  });
});
