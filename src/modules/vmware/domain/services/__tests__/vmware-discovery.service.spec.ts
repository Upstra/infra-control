import { Test, TestingModule } from '@nestjs/testing';
import { VmwareDiscoveryService } from '../vmware-discovery.service';
import { VmwareService } from '../vmware.service';
import { VmwareConnectionService } from '../vmware-connection.service';
import { VmwareDiscoveryGateway } from '../../../application/gateway/vmware-discovery.gateway';
import { ServerRepositoryInterface } from '../../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { DiscoveryStatus, DiscoveryProgressDto } from '../../../application/dto';
import { VmwareVm } from '../../../domain/interfaces/vmware-vm.interface';
import { SaveDiscoveredVmsUseCase } from '../../../application/use-cases/save-discovered-vms.use-case';
import { DiscoverySessionService } from '../discovery-session.service';
import { Logger } from '@nestjs/common';

describe('VmwareDiscoveryService', () => {
  let service: VmwareDiscoveryService;
  let vmwareService: jest.Mocked<VmwareService>;
  let vmwareConnectionService: jest.Mocked<VmwareConnectionService>;
  let discoveryGateway: jest.Mocked<VmwareDiscoveryGateway>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let saveDiscoveredVmsUseCase: jest.Mocked<SaveDiscoveredVmsUseCase>;
  let discoverySessionService: jest.Mocked<DiscoverySessionService>;
  let loggerSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  const mockServer: Server = {
    id: 'server-123',
    name: 'ESXi Host 1',
    ip: '192.168.1.10',
    login: 'root',
    password: 'password',
    type: 'esxi',
    state: 'started',
    adminUrl: 'https://192.168.1.10',
    priority: 1,
    vmwareHostMoid: null,
  } as Server;

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

  const mockVmwareVm: VmwareVm = {
    moid: 'vm-123',
    name: 'Test VM',
    ip: '192.168.1.100',
    guestOs: 'Ubuntu Linux (64-bit)',
    guestFamily: 'linuxGuest',
    version: 'vmx-13',
    createDate: '2023-01-01',
    numCoresPerSocket: 2,
    numCPU: 4,
    esxiHostName: 'esxi-host-1',
    esxiHostMoid: 'host-456',
    powerState: 'poweredOn',
    memoryMB: 4096,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmwareDiscoveryService,
        {
          provide: VmwareService,
          useValue: {
            listVMs: jest.fn(),
          },
        },
        {
          provide: VmwareConnectionService,
          useValue: {
            buildVmwareConnection: jest.fn(),
          },
        },
        {
          provide: VmwareDiscoveryGateway,
          useValue: {
            emitDiscoveryProgress: jest.fn(),
            emitDiscoveryComplete: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            updateServer: jest.fn(),
          },
        },
        {
          provide: SaveDiscoveredVmsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DiscoverySessionService,
          useValue: {
            createSession: jest.fn(),
            updateSession: jest.fn(),
            completeSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VmwareDiscoveryService>(VmwareDiscoveryService);
    vmwareService = module.get(VmwareService);
    vmwareConnectionService = module.get(VmwareConnectionService);
    discoveryGateway = module.get(VmwareDiscoveryGateway);
    serverRepository = module.get('ServerRepositoryInterface');
    saveDiscoveredVmsUseCase = module.get(SaveDiscoveredVmsUseCase);
    discoverySessionService = module.get(DiscoverySessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerDebugSpy.mockRestore();
  });

  describe('discoverVmsFromServers', () => {
    it('should discover VMs from VMware servers', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({
        host: mockServer.ip,
        username: mockServer.login,
        password: mockServer.password,
      } as any);

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.totalVmsDiscovered).toBe(1);
      expect(result.totalServersProcessed).toBe(1);
      expect(result.successfulServers).toBe(1);
      expect(result.failedServers).toBe(0);
      expect(result.allDiscoveredVms).toHaveLength(1);

      expect(discoverySessionService.createSession).toHaveBeenCalledWith(sessionId, 1);
      expect(discoverySessionService.updateSession).toHaveBeenCalled();
      expect(discoverySessionService.completeSession).toHaveBeenCalled();

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: DiscoveryStatus.STARTING,
          totalServers: 1,
        }),
      );

      expect(discoveryGateway.emitDiscoveryComplete).toHaveBeenCalledWith(
        sessionId,
        result,
      );

      expect(saveDiscoveredVmsUseCase.execute).toHaveBeenCalledWith({
        vms: expect.arrayContaining([
          expect.objectContaining({
            moid: 'vm-123',
            name: 'Test VM',
          }),
        ]),
      });
    });


    it('should handle empty server list', async () => {
      const result = await service.discoverVmsFromServers([], 'session-123');

      expect(result).toEqual({
        totalVmsDiscovered: 0,
        totalServersProcessed: 0,
        successfulServers: 0,
        failedServers: 0,
        serverResults: [],
        allDiscoveredVms: [],
      });

      expect(discoverySessionService.createSession).not.toHaveBeenCalled();
    });

    it('should filter non-VMware servers and log warning', async () => {
      const mixedServers = [
        mockServer,
        { ...mockServer, id: 'server-456', type: 'other' } as Server,
        { ...mockServer, id: 'server-789', type: 'physical' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromServers(
        mixedServers,
        sessionId,
      );

      expect(result.totalServersProcessed).toBe(1);
      expect(vmwareService.listVMs).toHaveBeenCalledTimes(1);
    });

    it('should handle discovery errors gracefully', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockRejectedValue(new Error('Connection failed'));

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.failedServers).toBe(1);
      expect(result.successfulServers).toBe(0);
      expect(result.totalVmsDiscovered).toBe(0);
      expect(result.serverResults[0].error).toBe('Connection failed');

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: DiscoveryStatus.ERROR,
          error: 'Connection failed',
        }),
      );
    });


    it('should handle save VMs failures with errors', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 0,
        failedCount: 1,
        savedVms: [],
        errors: [{ vm: 'Test VM', error: 'Failed to save VM: Database error' }],
      });

      await service.discoverVmsFromServers(servers, sessionId);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Some VMs failed to save:',
        [{ vm: 'Test VM', error: 'Failed to save VM: Database error' }],
      );
    });

    it('should handle save VMs complete failure', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockRejectedValue(
        new Error('Save service error'),
      );

      await service.discoverVmsFromServers(servers, sessionId);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to save discovered VMs:',
        expect.any(Error),
      );
    });

    it('should handle no VMware servers found', async () => {
      const servers = [
        { ...mockServer, type: 'physical' } as Server,
        { ...mockServer, type: 'other' } as Server,
      ];
      const sessionId = 'session-123';

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result).toEqual({
        totalVmsDiscovered: 0,
        totalServersProcessed: 0,
        successfulServers: 0,
        failedServers: 0,
        serverResults: [],
        allDiscoveredVms: [],
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No VMware servers found in the provided list',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Supported types: vmware, esxi, vcenter',
      );
    });

    it('should process multiple servers sequentially', async () => {
      const servers = [
        mockServer,
        { ...mockServer, id: 'server-456', name: 'ESXi Host 2' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs
        .mockResolvedValueOnce([mockVmwareVm])
        .mockResolvedValueOnce([
          { ...mockVmwareVm, moid: 'vm-456', name: 'Test VM 2' },
        ]);

      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 2,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.totalVmsDiscovered).toBe(2);
      expect(result.totalServersProcessed).toBe(2);
      expect(result.successfulServers).toBe(2);
      expect(vmwareService.listVMs).toHaveBeenCalledTimes(2);
    });
  });

  describe('discoverVmsFromServer', () => {
    it('should discover VMs from a single server', async () => {
      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.vmCount).toBe(1);
      expect(result.vms).toHaveLength(1);
      expect(result.vms[0]).toEqual({
        moid: 'vm-123',
        name: 'Test VM',
        ip: '192.168.1.100',
        guestOs: 'Ubuntu Linux (64-bit)',
        powerState: 'poweredOn',
        memoryMB: 4096,
        numCpu: 4,
        serverId: 'server-123',
        serverName: 'ESXi Host 1',
        esxiHostMoid: 'host-456',
      });
    });

    it('should handle VMs without host moid', async () => {
      const vmWithoutHostMoid = { ...mockVmwareVm, esxiHostMoid: undefined };
      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([vmWithoutHostMoid]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
    });

    it('should handle empty VM list', async () => {
      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.vmCount).toBe(0);
    });

    it('should handle discovery errors', async () => {
      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(result.vmCount).toBe(0);
      expect(result.vms).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockRejectedValue('String error');

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('discoverVmsFromVCenter', () => {
    it('should discover VMs from vCenter and assign to ESXi servers', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: 'host-456' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(1);
      expect(result.totalServersProcessed).toBe(1);
      expect(result.successfulServers).toBe(1);
      expect(result.failedServers).toBe(0);
      expect(result.allDiscoveredVms[0].serverId).toBe('server-123');
      expect(result.allDiscoveredVms[0].serverName).toBe('ESXi Host 1');

      expect(discoverySessionService.createSession).toHaveBeenCalledWith(
        sessionId,
        1,
      );
    });

    it('should handle orphan VMs without matching ESXi servers', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: 'different-host' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(0);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `VM ${mockVmwareVm.name} has esxiHostMoid ${mockVmwareVm.esxiHostMoid}`,
        ),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Found 1 VMs without matching ESXi servers',
      );
    });

    it('should handle vCenter discovery errors', async () => {
      const esxiServers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockRejectedValue(
        new Error('vCenter connection failed'),
      );

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.failedServers).toBe(1);
      expect(result.successfulServers).toBe(0);
      expect(result.totalVmsDiscovered).toBe(0);
      expect(result.serverResults[0].error).toBe('vCenter connection failed');

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: DiscoveryStatus.ERROR,
          error: 'vCenter connection failed',
        }),
      );

      expect(discoverySessionService.completeSession).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          failedServers: 1,
          failedServerIds: ['vcenter-123'],
        }),
      );
    });

    it('should handle vCenter non-Error exceptions', async () => {
      const esxiServers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockRejectedValue('String error');

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.serverResults[0].error).toBe('Unknown error occurred');
    });

    it('should handle save failure for vCenter discovery', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: 'host-456' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 0,
        failedCount: 1,
        savedVms: [],
        errors: [{ vm: 'Test VM', error: 'Save error' }],
      });

      await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Some VMs failed to save:',
        [{ vm: 'Test VM', error: 'Save error' }],
      );
    });

    it('should handle ESXi servers without MOIDs', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: null } as Server,
        { ...mockServer, id: 'server-456', vmwareHostMoid: 'host-456' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(1);
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'ESXi server map contains 1 servers with MOIDs',
      );
    });

    it('should emit proper progress events during vCenter discovery', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: 'host-456' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      const progressCalls = discoveryGateway.emitDiscoveryProgress.mock.calls;
      expect(progressCalls[0][1]).toMatchObject({
        status: DiscoveryStatus.STARTING,
        progress: 0,
      });
      expect(progressCalls[1][1]).toMatchObject({
        status: DiscoveryStatus.DISCOVERING,
        progress: 10,
      });
      expect(progressCalls[2][1]).toMatchObject({
        status: DiscoveryStatus.COMPLETED,
        progress: 90,
        discoveredVms: 1,
      });
    });

    it('should handle empty VM list from vCenter', async () => {
      const esxiServers = [
        { ...mockServer, vmwareHostMoid: 'host-456' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([]);

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        esxiServers,
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(0);
      expect(result.successfulServers).toBe(1);
      expect(saveDiscoveredVmsUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Private methods indirectly tested', () => {
    it('should emit progress with default values when partial data provided', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareConnectionService.buildVmwareConnection.mockReturnValue({} as any);
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      await service.discoverVmsFromServers(servers, sessionId);

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          timestamp: expect.any(Date),
        }),
      );
    });
  });
});