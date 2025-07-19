import { Test, TestingModule } from '@nestjs/testing';
import { VmSyncScheduler } from '../vm-sync.scheduler';
import { ConfigService } from '@nestjs/config';
import { VmwareDiscoveryService } from '../../../domain/services/vmware-discovery.service';
import { SaveDiscoveredVmsUseCase } from '../../use-cases/save-discovered-vms.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Logger } from '@nestjs/common';
import { Server } from '@/modules/servers/domain/entities/server.entity';

describe('VmSyncScheduler', () => {
  let scheduler: VmSyncScheduler;
  let configService: jest.Mocked<ConfigService>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let vmwareDiscoveryService: jest.Mocked<VmwareDiscoveryService>;
  let saveDiscoveredVmsUseCase: jest.Mocked<SaveDiscoveredVmsUseCase>;
  let loggerSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  const mockVCenterServer: Server = {
    id: 'vcenter-123',
    name: 'vCenter Server',
    ip: '192.168.1.50',
    login: 'administrator',
    password: 'password',
    type: 'vcenter',
    state: 'started',
    adminUrl: 'https://192.168.1.50',
    priority: 1,
    vmwareHostMoid: null,
  } as Server;

  const mockDiscoveredVms = [
    {
      moid: 'vm-1',
      name: 'Test VM 1',
      ip: '192.168.1.101',
      guestOs: 'Ubuntu Linux',
      powerState: 'poweredOn',
      memoryMB: 4096,
      numCpu: 2,
      serverId: 'server-123',
      serverName: 'ESXi Host 1',
      esxiHostMoid: 'host-1',
    },
    {
      moid: 'vm-2',
      name: 'Test VM 2',
      ip: '192.168.1.102',
      guestOs: 'Windows Server',
      powerState: 'poweredOn',
      memoryMB: 8192,
      numCpu: 4,
      serverId: 'server-123',
      serverName: 'ESXi Host 1',
      esxiHostMoid: 'host-1',
    },
    {
      moid: 'vm-3',
      name: 'Test VM 3',
      ip: '192.168.1.103',
      guestOs: 'CentOS Linux',
      powerState: 'poweredOff',
      memoryMB: 2048,
      numCpu: 1,
      serverId: 'server-456',
      serverName: 'ESXi Host 2',
      esxiHostMoid: 'host-2',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmSyncScheduler,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findServerByTypeWithCredentials: jest.fn(),
          },
        },
        {
          provide: VmwareDiscoveryService,
          useValue: {
            discoverVmsFromServer: jest.fn(),
          },
        },
        {
          provide: SaveDiscoveredVmsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    scheduler = module.get<VmSyncScheduler>(VmSyncScheduler);
    configService = module.get(ConfigService);
    serverRepository = module.get('ServerRepositoryInterface');
    vmwareDiscoveryService = module.get(VmwareDiscoveryService);
    saveDiscoveredVmsUseCase = module.get(SaveDiscoveredVmsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    loggerSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    loggerDebugSpy.mockRestore();
  });

  describe('syncVMs', () => {
    it('should skip sync when disabled', async () => {
      configService.get.mockReturnValue(false);

      await scheduler.syncVMs();

      expect(serverRepository.findServerByTypeWithCredentials).not.toHaveBeenCalled();
    });

    it('should skip sync when already running', async () => {
      configService.get.mockReturnValue(true);
      
      // Set isRunning to true by starting a sync
      const firstSync = scheduler.syncVMs();
      
      // Try to start another sync immediately
      await scheduler.syncVMs();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'VM sync is already running, skipping this execution',
      );

      // Clean up the first sync
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(null);
      await firstSync;
    });

    it('should handle no vCenter server found', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(null);

      await scheduler.syncVMs();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No vCenter server found for VM sync',
      );
    });

    it('should successfully sync VMs from vCenter', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 3,
        vms: mockDiscoveredVms,
      });
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 3,
        failedCount: 0,
        savedVms: [],
        errors: [],
        created: 1,
        updated: 2,
        changes: 3,
      });

      await scheduler.syncVMs();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Starting scheduled VM synchronization',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Starting VM sync from vCenter: ${mockVCenterServer.name} (${mockVCenterServer.ip})`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Discovered 3 VMs across 2 ESXi hosts',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'VM sync results: 1 created, 2 updated, 3 total changes',
      );
      expect(loggerDebugSpy).toHaveBeenCalledWith('ESXi host host-1: 2 VMs');
      expect(loggerDebugSpy).toHaveBeenCalledWith('ESXi host host-2: 1 VMs');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('VM sync completed in'),
      );
    });

    it('should handle VMs without esxiHostMoid', async () => {
      const vmsWithoutHost = [
        { ...mockDiscoveredVms[0], esxiHostMoid: undefined },
        { ...mockDiscoveredVms[1], esxiHostMoid: undefined },
      ];

      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 2,
        vms: vmsWithoutHost,
      });
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 2,
        failedCount: 0,
        savedVms: [],
        errors: [],
        created: 2,
        updated: 0,
        changes: 2,
      });

      await scheduler.syncVMs();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Discovered 2 VMs across 1 ESXi hosts',
      );
      expect(loggerDebugSpy).toHaveBeenCalledWith('ESXi host unknown: 2 VMs');
    });

    it('should handle no VMs discovered', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 0,
        vms: [],
      });

      await scheduler.syncVMs();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No VMs discovered from vCenter',
      );
    });

    it('should handle discovery errors', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockRejectedValue(
        new Error('Discovery failed'),
      );

      await scheduler.syncVMs();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to sync VMs from vCenter: Discovery failed',
        expect.any(String),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'VM sync completed with errors:',
        expect.arrayContaining([
          { serverName: 'vCenter Server', error: 'Discovery failed' },
        ]),
      );
    });

    it('should handle save errors', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 3,
        vms: mockDiscoveredVms,
      });
      saveDiscoveredVmsUseCase.execute.mockRejectedValue(
        new Error('Save failed'),
      );

      await scheduler.syncVMs();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to sync VMs from vCenter: Save failed',
        expect.any(String),
      );
    });

    it('should handle general scheduler errors', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockRejectedValue(
        new Error('Database error'),
      );

      await scheduler.syncVMs();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'VM sync scheduler failed:',
        expect.any(Error),
      );
    });

    it('should ensure isRunning is reset on error', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockRejectedValue(
        new Error('Database error'),
      );

      await scheduler.syncVMs();

      // Try another sync to verify isRunning was reset
      configService.get.mockReturnValue(false);
      await scheduler.syncVMs();

      // If isRunning wasn't reset, we would see the "already running" warning
      expect(loggerWarnSpy).not.toHaveBeenCalledWith(
        'VM sync is already running, skipping this execution',
      );
    });

    it('should handle discovery result without vms property', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 0,
        vms: undefined as any,
      });

      await scheduler.syncVMs();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No VMs discovered from vCenter',
      );
    });

    it('should handle save result without changes property', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 1,
        vms: [mockDiscoveredVms[0]],
      });
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
        created: 1,
        updated: 0,
      } as any);

      await scheduler.syncVMs();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Changes: 0'),
      );
    });

    it('should handle errors without message property', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockRejectedValue(
        'String error',
      );

      await scheduler.syncVMs();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to sync VMs from vCenter: Unknown error',
        undefined,
      );
    });
  });

  describe('triggerManualSync', () => {
    it('should return error when sync is already running', async () => {
      configService.get.mockReturnValue(true);
      
      // Start a sync to set isRunning to true
      const firstSync = scheduler.syncVMs();
      
      const result = await scheduler.triggerManualSync();

      expect(result).toEqual({
        success: false,
        message: 'VM synchronization is already in progress',
      });

      // Clean up
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(null);
      await firstSync;
    });

    it('should successfully trigger manual sync', async () => {
      configService.get.mockReturnValue(true);
      serverRepository.findServerByTypeWithCredentials.mockResolvedValue(
        mockVCenterServer,
      );
      vmwareDiscoveryService.discoverVmsFromServer.mockResolvedValue({
        serverId: 'vcenter-123',
        serverName: 'vCenter Server',
        success: true,
        vmCount: 3,
        vms: mockDiscoveredVms,
      });
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 3,
        failedCount: 0,
        savedVms: [],
        errors: [],
        created: 1,
        updated: 2,
        changes: 3,
      });

      const result = await scheduler.triggerManualSync();

      expect(result.success).toBe(true);
      expect(result.message).toBe('VM synchronization completed successfully');
      expect(result.duration).toMatch(/^\d+\.\d+s$/);
    });

    it('should handle manual sync failure', async () => {
      // Mock syncVMs to throw an error
      jest.spyOn(scheduler, 'syncVMs').mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await scheduler.triggerManualSync();

      expect(result).toEqual({
        success: false,
        message: 'VM synchronization failed',
        errors: [
          { serverName: 'System', error: 'Database connection failed' },
        ],
      });
    });
  });

  describe('Cron decorator', () => {
    it('should have the correct cron expression', () => {
      const cronMetadata = Reflect.getMetadata(
        'SCHEDULE_CRON_OPTIONS',
        scheduler.syncVMs,
      );
      expect(cronMetadata).toEqual({
        cronTime: '0 */30 * * * *',
      });
    });
  });
});