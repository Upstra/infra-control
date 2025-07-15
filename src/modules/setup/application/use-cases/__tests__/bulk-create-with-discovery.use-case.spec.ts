import { Test, TestingModule } from '@nestjs/testing';
import { BulkCreateWithDiscoveryUseCase } from '../bulk-create-with-discovery.use-case';
import { BulkCreateUseCase } from '../bulk-create.use-case';
import { VmwareDiscoveryService } from '../../../../vmware/domain/services/vmware-discovery.service';
import { ServerRepositoryInterface } from '../../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('BulkCreateWithDiscoveryUseCase', () => {
  let useCase: BulkCreateWithDiscoveryUseCase;
  let bulkCreateUseCase: jest.Mocked<BulkCreateUseCase>;
  let vmwareDiscoveryService: jest.Mocked<VmwareDiscoveryService>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockBulkCreateResult = {
    success: true,
    created: {
      rooms: [{ id: 'room-1', name: 'Room 1', tempId: 'temp_room_1' }],
      upsList: [{ id: 'ups-1', name: 'UPS 1', tempId: 'temp_ups_1' }],
      servers: [
        { id: 'server-1', name: 'VMware Server 1', tempId: 'temp_server_1' },
        { id: 'server-2', name: 'ESXi Server 1', tempId: 'temp_server_2' },
      ],
    },
    idMapping: {
      rooms: { temp_room_1: 'room-1' },
      ups: { temp_ups_1: 'ups-1' },
    },
  };

  const mockVmwareServer = {
    id: 'server-1',
    name: 'VMware Server 1',
    type: 'vmware',
    ip: '192.168.1.10',
    login: 'admin',
    password: 'password',
    state: 'stopped',
    adminUrl: 'https://192.168.1.10',
    priority: 1,
    roomId: 'room-1',
  } as any as Server;

  const mockEsxiServer = {
    id: 'server-2',
    name: 'ESXi Server 1',
    type: 'esxi',
    ip: '192.168.1.20',
    login: 'admin',
    password: 'password',
    state: 'stopped',
    adminUrl: 'https://192.168.1.20',
    priority: 2,
    roomId: 'room-1',
  } as any as Server;

  const mockDiscoveryResults = {
    totalVmsDiscovered: 5,
    totalServersProcessed: 1,
    successfulServers: 1,
    failedServers: 0,
    serverResults: [],
    allDiscoveredVms: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkCreateWithDiscoveryUseCase,
        {
          provide: BulkCreateUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: VmwareDiscoveryService,
          useValue: {
            discoverVmsFromServers: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findServerById: jest.fn(),
            findServerByIdWithCredentials: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<BulkCreateWithDiscoveryUseCase>(
      BulkCreateWithDiscoveryUseCase,
    );
    bulkCreateUseCase = module.get(BulkCreateUseCase);
    vmwareDiscoveryService = module.get(VmwareDiscoveryService);
    serverRepository = module.get('ServerRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRequest = {
      rooms: [{ name: 'Room 1', tempId: 'temp_room_1' }],
      upsList: [
        {
          name: 'UPS 1',
          roomId: 'temp_room_1',
          grace_period_on: 30,
          grace_period_off: 30,
          tempId: 'temp_ups_1',
        },
      ],
      servers: [
        {
          name: 'VMware Server 1',
          type: 'vmware',
          state: 'stopped',
          grace_period_on: 30,
          grace_period_off: 30,
          adminUrl: 'https://192.168.1.10',
          ip: '192.168.1.10',
          login: 'admin',
          password: 'password',
          priority: 1,
          roomId: 'temp_room_1',
          tempId: 'temp_server_1',
        },
        {
          name: 'ESXi Server 1',
          type: 'esxi',
          state: 'stopped',
          grace_period_on: 30,
          grace_period_off: 30,
          adminUrl: 'https://192.168.1.20',
          ip: '192.168.1.20',
          login: 'admin',
          password: 'password',
          priority: 2,
          roomId: 'temp_room_1',
          tempId: 'temp_server_2',
        },
      ],
    };

    it('should successfully create resources and trigger discovery for VMware servers', async () => {
      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce(mockVmwareServer)
        .mockResolvedValueOnce(mockEsxiServer);
      vmwareDiscoveryService.discoverVmsFromServers.mockResolvedValue(
        mockDiscoveryResults,
      );

      const result = await useCase.execute(mockRequest);

      expect(result).toEqual({
        ...mockBulkCreateResult,
        discoverySessionId: expect.any(String),
        discoveryTriggered: true,
        vmwareServerCount: 2,
      });

      expect(bulkCreateUseCase.execute).toHaveBeenCalledWith(mockRequest);
      expect(
        serverRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(2);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).toHaveBeenCalledWith(
        [mockVmwareServer, mockEsxiServer],
        expect.any(String),
      );
    });

    it('should handle bulk create failure gracefully', async () => {
      const failureResult = {
        success: false,
        created: {
          rooms: [],
          upsList: [],
          servers: [],
        },
        idMapping: {
          rooms: {},
          ups: {},
        },
        errors: [
          {
            resource: 'room' as const,
            name: 'Room 1',
            error: 'Already exists',
          },
        ],
      };

      bulkCreateUseCase.execute.mockResolvedValue(failureResult);

      const result = await useCase.execute(mockRequest);

      expect(result).toEqual({
        ...failureResult,
        discoveryTriggered: false,
      });

      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).not.toHaveBeenCalled();
    });

    it('should skip discovery when no VMware servers are present', async () => {
      const requestWithoutVmware = {
        ...mockRequest,
        servers: [mockRequest.servers[1]], // Only non-VMware server
      };

      bulkCreateUseCase.execute.mockResolvedValue({
        ...mockBulkCreateResult,
        created: {
          ...mockBulkCreateResult.created,
          servers: [
            {
              id: 'server-2',
              name: 'Non-VMware Server 1',
              tempId: 'temp_server_2',
            },
          ],
        },
      });

      const result = await useCase.execute(requestWithoutVmware);

      expect(result.discoveryTriggered).toBe(false);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).not.toHaveBeenCalled();
    });

    it('should skip discovery when enableDiscovery is explicitly false', async () => {
      const requestWithDiscoveryDisabled = {
        ...mockRequest,
        enableDiscovery: false,
      };

      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);

      const result = await useCase.execute(requestWithDiscoveryDisabled);

      expect(result.discoveryTriggered).toBe(false);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).not.toHaveBeenCalled();
    });

    it('should use provided discoverySessionId', async () => {
      const customSessionId = 'custom-session-123';
      const requestWithSessionId = {
        ...mockRequest,
        discoverySessionId: customSessionId,
      };

      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce(mockVmwareServer)
        .mockResolvedValueOnce(mockEsxiServer);
      vmwareDiscoveryService.discoverVmsFromServers.mockResolvedValue(
        mockDiscoveryResults,
      );

      const result = await useCase.execute(requestWithSessionId);

      expect(result.discoverySessionId).toBe(customSessionId);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).toHaveBeenCalledWith(expect.any(Array), customSessionId);
    });

    it('should handle discovery service errors gracefully', async () => {
      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce(mockVmwareServer)
        .mockResolvedValueOnce(mockEsxiServer);
      vmwareDiscoveryService.discoverVmsFromServers.mockRejectedValue(
        new Error('Discovery failed'),
      );

      const result = await useCase.execute(mockRequest);

      expect(result).toEqual({
        ...mockBulkCreateResult,
        discoverySessionId: expect.any(String),
        discoveryTriggered: true,
        vmwareServerCount: 1,
      });
    });

    it('should handle mixed server types correctly', async () => {
      const mixedServersResult = {
        ...mockBulkCreateResult,
        created: {
          ...mockBulkCreateResult.created,
          servers: [
            {
              id: 'server-1',
              name: 'VMware Server 1',
              tempId: 'temp_server_1',
            },
            { id: 'server-2', name: 'ESXi Server 1', tempId: 'temp_server_2' },
            { id: 'server-3', name: 'ESXi Server', tempId: 'temp_server_3' },
            { id: 'server-4', name: 'vCenter Server', tempId: 'temp_server_4' },
          ],
        },
      };

      const esxiServer = {
        ...mockVmwareServer,
        id: 'server-3',
        name: 'ESXi Server',
        type: 'esxi',
      } as any as Server;

      const vcenterServer = {
        ...mockVmwareServer,
        id: 'server-4',
        name: 'vCenter Server',
        type: 'vcenter',
      } as any as Server;

      bulkCreateUseCase.execute.mockResolvedValue(mixedServersResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce(mockVmwareServer)
        .mockResolvedValueOnce(mockEsxiServer)
        .mockResolvedValueOnce(esxiServer)
        .mockResolvedValueOnce(vcenterServer);
      vmwareDiscoveryService.discoverVmsFromServers.mockResolvedValue(
        mockDiscoveryResults,
      );

      const result = await useCase.execute(mockRequest);

      expect(result.vmwareServerCount).toBe(4);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).toHaveBeenCalledWith(
        [mockVmwareServer, mockEsxiServer, esxiServer, vcenterServer],
        expect.any(String),
      );
    });

    it('should handle case-insensitive server type matching', async () => {
      const requestWithMixedCase = {
        ...mockRequest,
        servers: [
          {
            ...mockRequest.servers[0],
            type: 'VMware', // Uppercase
          },
          {
            ...mockRequest.servers[1],
            type: 'ESXI', // Uppercase
          },
        ],
      };

      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce({
          ...mockVmwareServer,
          type: 'VMware',
        } as any as Server)
        .mockResolvedValueOnce({
          ...mockVmwareServer,
          id: 'server-2',
          name: 'ESXi Server',
          type: 'ESXI',
        } as any as Server);
      vmwareDiscoveryService.discoverVmsFromServers.mockResolvedValue(
        mockDiscoveryResults,
      );

      const result = await useCase.execute(requestWithMixedCase);

      expect(result.discoveryTriggered).toBe(true);
      expect(result.vmwareServerCount).toBe(1);
    });

    it('should return zero vmwareServerCount when no VMware servers found in repository', async () => {
      bulkCreateUseCase.execute.mockResolvedValue(mockBulkCreateResult);
      serverRepository.findServerByIdWithCredentials
        .mockResolvedValueOnce(null) // Server not found
        .mockResolvedValueOnce(mockEsxiServer);
      vmwareDiscoveryService.discoverVmsFromServers.mockResolvedValue(
        mockDiscoveryResults,
      );

      const result = await useCase.execute(mockRequest);

      expect(result.vmwareServerCount).toBe(1);
      expect(result.discoveryTriggered).toBe(true);
      expect(
        vmwareDiscoveryService.discoverVmsFromServers,
      ).toHaveBeenCalledWith([mockEsxiServer], expect.any(String));
    });
  });

  describe('hasVmwareServers', () => {
    const mockServerBase = {
      name: 'Test Server',
      state: 'stopped',
      grace_period_on: 30,
      grace_period_off: 30,
      adminUrl: 'https://192.168.1.10',
      ip: '192.168.1.10',
      login: 'admin',
      password: 'password',
      priority: 1,
      roomId: 'temp_room_1',
    };

    it('should detect VMware servers by type', () => {
      const requestWithVmware = {
        rooms: [],
        upsList: [],
        servers: [
          { ...mockServerBase, type: 'vmware' },
          { ...mockServerBase, type: 'esxi' },
        ],
      };

      const result = useCase['hasVmwareServers'](requestWithVmware);
      expect(result).toBe(true);
    });

    it('should detect ESXi servers', () => {
      const requestWithEsxi = {
        rooms: [],
        upsList: [],
        servers: [{ ...mockServerBase, type: 'esxi' }],
      };

      const result = useCase['hasVmwareServers'](requestWithEsxi);
      expect(result).toBe(true);
    });

    it('should detect vCenter servers', () => {
      const requestWithVcenter = {
        rooms: [],
        upsList: [],
        servers: [{ ...mockServerBase, type: 'vcenter' }],
      };

      const result = useCase['hasVmwareServers'](requestWithVcenter);
      expect(result).toBe(true);
    });

    it('should return false when no VMware servers present', () => {
      const requestWithoutVmware = {
        rooms: [],
        upsList: [],
        servers: [{ ...mockServerBase, type: 'ilo' }],
      };

      const result = useCase['hasVmwareServers'](requestWithoutVmware);
      expect(result).toBe(false);
    });
  });
});
