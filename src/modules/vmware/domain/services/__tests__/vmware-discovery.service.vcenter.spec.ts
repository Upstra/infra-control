import { Test, TestingModule } from '@nestjs/testing';
import { VmwareDiscoveryService } from '../vmware-discovery.service';
import { VmwareService } from '../vmware.service';
import { VmwareDiscoveryGateway } from '../../../application/gateway/vmware-discovery.gateway';
import { SaveDiscoveredVmsUseCase } from '../../../application/use-cases/save-discovered-vms.use-case';
import { DiscoverySessionService } from '../discovery-session.service';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { DiscoveryStatus } from '../../../application/dto';

describe('VmwareDiscoveryService - vCenter Discovery', () => {
  let service: VmwareDiscoveryService;
  let vmwareService: jest.Mocked<VmwareService>;
  let discoveryGateway: jest.Mocked<VmwareDiscoveryGateway>;
  let saveDiscoveredVmsUseCase: jest.Mocked<SaveDiscoveredVmsUseCase>;
  let discoverySessionService: jest.Mocked<DiscoverySessionService>;

  const mockVCenterServer = {
    id: 'vcenter-1',
    name: 'vCenter Server',
    type: 'vcenter',
    ip: '172.23.20.14',
    login: 'admin',
    password: 'password123',
  } as Server;

  const mockEsxiServer1 = {
    id: 'esxi-1',
    name: 'ESXi Server 1',
    type: 'esxi',
    ip: '192.168.1.10',
    vmwareHostMoid: 'host-14',
  } as Server;

  const mockEsxiServer2 = {
    id: 'esxi-2',
    name: 'ESXi Server 2',
    type: 'esxi',
    ip: '192.168.1.20',
    vmwareHostMoid: 'host-24',
  } as Server;

  const mockVmsFromVCenter = [
    {
      name: 'UPS-WEBSRV02',
      moid: 'vm-1007',
      ip: '172.23.30.213',
      guestOs: 'Microsoft Windows XP Professional (32-bit)',
      guestFamily: 'windowsGuest',
      version: 'vmx-08',
      createDate: '2025-06-30T17:02:03.497903+00:00',
      numCoresPerSocket: 1,
      numCPU: 1,
      esxiHostName: 'esxsrv12.eurialys.local',
      esxiHostMoid: 'host-24',
      powerState: 'poweredOn',
      memoryMB: 2048,
    },
    {
      name: 'UPS-APPSRV01',
      moid: 'vm-1004',
      ip: '172.23.30.218',
      guestOs: 'Microsoft Windows XP Professional (32-bit)',
      guestFamily: 'windowsGuest',
      version: 'vmx-08',
      createDate: '2025-06-30T16:40:22.948611+00:00',
      numCoresPerSocket: 1,
      numCPU: 1,
      esxiHostName: 'esxsrv11.eurialys.local',
      esxiHostMoid: 'host-14',
      powerState: 'poweredOn',
      memoryMB: 4096,
    },
    {
      name: 'OrphanVM',
      moid: 'vm-9999',
      ip: '172.23.30.999',
      guestOs: 'Ubuntu Linux (64-bit)',
      guestFamily: 'linuxGuest',
      version: 'vmx-10',
      createDate: '2025-07-01T10:00:00.000000+00:00',
      numCoresPerSocket: 2,
      numCPU: 2,
      esxiHostName: 'unknown-host.local',
      esxiHostMoid: 'host-999',
      powerState: 'poweredOff',
      memoryMB: 8192,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmwareDiscoveryService,
        {
          provide: VmwareService,
          useValue: {
            listVMs: jest.fn(),
            listServers: jest.fn(),
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
    discoveryGateway = module.get(VmwareDiscoveryGateway);
    saveDiscoveredVmsUseCase = module.get(SaveDiscoveredVmsUseCase);
    discoverySessionService = module.get(DiscoverySessionService);
  });

  describe('discoverVmsFromVCenter', () => {
    const sessionId = 'test-session-123';

    it('should successfully discover VMs from vCenter and associate them with ESXi servers', async () => {
      vmwareService.listVMs.mockResolvedValue(mockVmsFromVCenter);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 2,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [mockEsxiServer1, mockEsxiServer2],
        sessionId,
      );

      expect(discoverySessionService.createSession).toHaveBeenCalledWith(
        sessionId,
        1,
      );

      expect(vmwareService.listVMs).toHaveBeenCalledWith({
        host: mockVCenterServer.ip,
        user: mockVCenterServer.login,
        password: mockVCenterServer.password,
        port: 443,
      });

      expect(saveDiscoveredVmsUseCase.execute).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'UPS-WEBSRV02',
            serverId: 'esxi-2',
            serverName: 'ESXi Server 2',
            esxiHostMoid: 'host-24',
          }),
          expect.objectContaining({
            name: 'UPS-APPSRV01',
            serverId: 'esxi-1',
            serverName: 'ESXi Server 1',
            esxiHostMoid: 'host-14',
          }),
        ]),
      );

      expect(result).toEqual({
        totalVmsDiscovered: 2,
        totalServersProcessed: 1,
        successfulServers: 1,
        failedServers: 0,
        serverResults: [
          {
            serverId: mockVCenterServer.id,
            serverName: mockVCenterServer.name,
            success: true,
            vmCount: 2,
            vms: expect.arrayContaining([
              expect.objectContaining({ name: 'UPS-WEBSRV02' }),
              expect.objectContaining({ name: 'UPS-APPSRV01' }),
            ]),
          },
        ],
        allDiscoveredVms: expect.arrayContaining([
          expect.objectContaining({ name: 'UPS-WEBSRV02' }),
          expect.objectContaining({ name: 'UPS-APPSRV01' }),
        ]),
      });

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: DiscoveryStatus.COMPLETED,
          progress: 90,
          discoveredVms: 2,
        }),
      );

      expect(discoveryGateway.emitDiscoveryComplete).toHaveBeenCalledWith(
        sessionId,
        result,
      );
    });

    it('should handle VMs without matching ESXi servers (orphan VMs)', async () => {
      vmwareService.listVMs.mockResolvedValue(mockVmsFromVCenter);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 2,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      // Spy on logger.warn instead of console.log
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [mockEsxiServer1, mockEsxiServer2],
        sessionId,
      );

      // Should log warning about orphan VM
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 VMs without matching ESXi servers'),
      );

      loggerSpy.mockRestore();
    });

    it('should handle vCenter connection failure', async () => {
      const error = new Error('Connection refused');
      vmwareService.listVMs.mockRejectedValue(error);

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [mockEsxiServer1, mockEsxiServer2],
        sessionId,
      );

      expect(result).toEqual({
        totalVmsDiscovered: 0,
        totalServersProcessed: 1,
        successfulServers: 0,
        failedServers: 1,
        serverResults: [
          {
            serverId: mockVCenterServer.id,
            serverName: mockVCenterServer.name,
            success: false,
            vmCount: 0,
            vms: [],
            error: 'Connection refused',
          },
        ],
        allDiscoveredVms: [],
      });

      expect(discoveryGateway.emitDiscoveryProgress).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          status: DiscoveryStatus.ERROR,
          error: 'Connection refused',
        }),
      );
    });

    it('should handle empty ESXi server list', async () => {
      vmwareService.listVMs.mockResolvedValue(mockVmsFromVCenter);

      await service.discoverVmsFromVCenter(mockVCenterServer, [], sessionId);

      // All VMs should be treated as orphans
      expect(saveDiscoveredVmsUseCase.execute).not.toHaveBeenCalled();

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [],
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(0);
    });

    it('should handle ESXi servers without MOIDs', async () => {
      const esxiWithoutMoid = {
        ...mockEsxiServer1,
        vmwareHostMoid: undefined,
      } as Server;

      vmwareService.listVMs.mockResolvedValue(mockVmsFromVCenter);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [esxiWithoutMoid, mockEsxiServer2],
        sessionId,
      );

      // Should only discover VMs for ESXi server 2
      expect(result.totalVmsDiscovered).toBe(1);
      expect(saveDiscoveredVmsUseCase.execute).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'UPS-WEBSRV02',
            serverId: 'esxi-2',
          }),
        ]),
      );
    });

    it('should handle save failures gracefully', async () => {
      vmwareService.listVMs.mockResolvedValue(mockVmsFromVCenter);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 1,
        savedVms: [],
        errors: [{ vm: 'UPS-APPSRV01', error: 'Failed to save VM' }],
      });

      // Spy on logger.warn
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [mockEsxiServer1, mockEsxiServer2],
        sessionId,
      );

      expect(result.totalVmsDiscovered).toBe(2);
      expect(loggerSpy).toHaveBeenCalledWith(
        'Some VMs failed to save:',
        expect.arrayContaining([
          { vm: 'UPS-APPSRV01', error: 'Failed to save VM' },
        ]),
      );

      loggerSpy.mockRestore();
    });

    it('should correctly map VM data from vCenter format', async () => {
      vmwareService.listVMs.mockResolvedValue([mockVmsFromVCenter[0]]);
      saveDiscoveredVmsUseCase.execute.mockResolvedValue({
        savedCount: 1,
        failedCount: 0,
        savedVms: [],
        errors: [],
      });

      await service.discoverVmsFromVCenter(
        mockVCenterServer,
        [mockEsxiServer2],
        sessionId,
      );

      expect(saveDiscoveredVmsUseCase.execute).toHaveBeenCalledWith([
        {
          moid: 'vm-1007',
          name: 'UPS-WEBSRV02',
          ip: '172.23.30.213',
          guestOs: 'Microsoft Windows XP Professional (32-bit)',
          powerState: 'poweredOn',
          memoryMB: 2048,
          numCpu: 1,
          serverId: 'esxi-2',
          serverName: 'ESXi Server 2',
          esxiHostMoid: 'host-24',
        },
      ]);
    });
  });
});
