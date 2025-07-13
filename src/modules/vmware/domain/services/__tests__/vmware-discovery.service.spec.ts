import { Test, TestingModule } from '@nestjs/testing';
import { VmwareDiscoveryService } from '../vmware-discovery.service';
import { VmwareService } from '../vmware.service';
import { VmwareDiscoveryGateway } from '../../../application/gateway/vmware-discovery.gateway';
import { ServerRepositoryInterface } from '../../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { DiscoveryStatus } from '../../../application/dto';
import { VmwareVm } from '../../../domain/interfaces/vmware-vm.interface';

describe('VmwareDiscoveryService', () => {
  let service: VmwareDiscoveryService;
  let vmwareService: jest.Mocked<VmwareService>;
  let discoveryGateway: jest.Mocked<VmwareDiscoveryGateway>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockServer: Server = {
    id: 'server-123',
    name: 'ESXi Host 1',
    ip: '192.168.1.10',
    login: 'root',
    password: 'password',
    type: 'esxi',
    state: 'started',
    adminUrl: 'https://192.168.1.10',
    grace_period_on: 30,
    grace_period_off: 30,
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
  };

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<VmwareDiscoveryService>(VmwareDiscoveryService);
    vmwareService = module.get(VmwareService);
    discoveryGateway = module.get(VmwareDiscoveryGateway);
    serverRepository = module.get('ServerRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverVmsFromServers', () => {
    it('should discover VMs from VMware servers', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.totalVmsDiscovered).toBe(1);
      expect(result.totalServersProcessed).toBe(1);
      expect(result.successfulServers).toBe(1);
      expect(result.failedServers).toBe(0);
      expect(result.allDiscoveredVms).toHaveLength(1);

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
    });

    it('should update server vmwareHostMoid when discovered', async () => {
      const serverWithoutMoid = { ...mockServer, vmwareHostMoid: null } as Server;
      const servers = [serverWithoutMoid];
      const sessionId = 'session-123';

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      serverRepository.updateServer.mockResolvedValue(mockServer);

      await service.discoverVmsFromServers(servers, sessionId);

      expect(serverRepository.updateServer).toHaveBeenCalledWith('server-123', {
        vmwareHostMoid: 'host-456',
      });
    });

    it('should not update server vmwareHostMoid if already set', async () => {
      const serverWithMoid = { ...mockServer, vmwareHostMoid: 'existing-moid' } as Server;
      const servers = [serverWithMoid];
      const sessionId = 'session-123';

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

      await service.discoverVmsFromServers(servers, sessionId);

      expect(serverRepository.updateServer).not.toHaveBeenCalled();
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
    });

    it('should filter non-VMware servers', async () => {
      const mixedServers = [
        mockServer,
        { ...mockServer, id: 'server-456', type: 'physical' } as Server,
      ];
      const sessionId = 'session-123';

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

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

      vmwareService.listVMs.mockRejectedValue(new Error('Connection failed'));

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.failedServers).toBe(1);
      expect(result.successfulServers).toBe(0);
      expect(result.totalVmsDiscovered).toBe(0);
      expect(result.serverResults[0].error).toBe('Connection failed');
    });

    it('should continue discovery even if host moid update fails', async () => {
      const servers = [mockServer];
      const sessionId = 'session-123';

      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);
      serverRepository.updateServer.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.discoverVmsFromServers(servers, sessionId);

      expect(result.totalVmsDiscovered).toBe(1);
      expect(result.successfulServers).toBe(1);
    });
  });

  describe('discoverVmsFromServer', () => {
    it('should discover VMs from a single server', async () => {
      vmwareService.listVMs.mockResolvedValue([mockVmwareVm]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.vmCount).toBe(1);
      expect(result.vms).toHaveLength(1);
      expect(result.hostMoid).toBe('host-456');
      expect(result.vms[0]).toEqual({
        moid: 'vm-123',
        name: 'Test VM',
        ip: '192.168.1.100',
        guestOs: 'Ubuntu Linux (64-bit)',
        powerState: undefined,
        memoryMB: undefined,
        numCpu: 4,
        serverId: 'server-123',
        serverName: 'ESXi Host 1',
        esxiHostMoid: 'host-456',
      });
    });

    it('should handle VMs without host moid', async () => {
      const vmWithoutHostMoid = { ...mockVmwareVm, esxiHostMoid: undefined };
      vmwareService.listVMs.mockResolvedValue([vmWithoutHostMoid]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.hostMoid).toBeUndefined();
    });

    it('should handle empty VM list', async () => {
      vmwareService.listVMs.mockResolvedValue([]);

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(true);
      expect(result.vmCount).toBe(0);
      expect(result.hostMoid).toBeUndefined();
    });

    it('should handle discovery errors', async () => {
      vmwareService.listVMs.mockRejectedValue(new Error('Connection timeout'));

      const result = await service.discoverVmsFromServer(mockServer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(result.vmCount).toBe(0);
      expect(result.vms).toEqual([]);
    });
  });
});