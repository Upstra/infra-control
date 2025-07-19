import { Test, TestingModule } from '@nestjs/testing';
import { GetServersWithVmsUseCase } from '../get-servers-with-vms.use-case';
import { ServerRepositoryInterface } from '../../../domain/interfaces/server.repository.interface';
import { ServerWithVmsResponseDto } from '../../dto/server-with-vms.response.dto';
import { Server } from '../../../domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';

describe('GetServersWithVmsUseCase', () => {
  let useCase: GetServersWithVmsUseCase;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockVm1: Vm = {
    id: 'vm-1',
    name: 'VM-Server1-01',
    state: 'running',
    serverId: 'server-1',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 1,
  } as Vm;

  const mockVm2: Vm = {
    id: 'vm-2',
    name: 'VM-Server1-02',
    state: 'stopped',
    serverId: 'server-1',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 2,
  } as Vm;

  const mockVm3: Vm = {
    id: 'vm-3',
    name: 'VM-Server2-01',
    state: 'running',
    serverId: 'server-2',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 1,
  } as Vm;

  const mockServer1: Server = {
    id: 'server-1',
    name: 'ESXi-Server-01',
    ip: '192.168.1.10',
    vmwareHostMoid: 'host-123',
    vms: [mockVm1, mockVm2],
    state: 'UP',
    type: 'ESXi',
    adminUrl: 'https://192.168.1.10',
    login: 'admin',
    priority: 1,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Server;

  const mockServer2: Server = {
    id: 'server-2',
    name: 'ESXi-Server-02',
    ip: '192.168.1.20',
    vmwareHostMoid: 'host-456',
    vms: [mockVm3],
    state: 'UP',
    type: 'ESXi',
    adminUrl: 'https://192.168.1.20',
    login: 'admin',
    priority: 2,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Server;

  const mockServers: Server[] = [mockServer1, mockServer2];

  beforeEach(async () => {
    const mockRepository = {
      findAllWithVms: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAllByField: jest.fn(),
      findAllByFieldPaginated: jest.fn(),
      findOneByField: jest.fn(),
      findServerById: jest.fn(),
      findServerByIdWithCredentials: jest.fn(),
      findAllWithCredentials: jest.fn(),
      deleteServer: jest.fn(),
      updateServer: jest.fn(),
      countByState: jest.fn(),
      findByIloIp: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServersWithVmsUseCase,
        {
          provide: 'ServerRepositoryInterface',
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetServersWithVmsUseCase>(GetServersWithVmsUseCase);
    serverRepository = module.get('ServerRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return servers with their VMs in light format', async () => {
      // Arrange
      serverRepository.findAllWithVms.mockResolvedValue(mockServers);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(serverRepository.findAllWithVms).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: 'server-1',
        name: 'ESXi-Server-01',
        ip: '192.168.1.10',
        hostMoid: 'host-123',
        vms: [
          { id: 'vm-1', name: 'VM-Server1-01', state: 'running' },
          { id: 'vm-2', name: 'VM-Server1-02', state: 'stopped' },
        ],
      });

      expect(result[1]).toEqual({
        id: 'server-2',
        name: 'ESXi-Server-02',
        ip: '192.168.1.20',
        hostMoid: 'host-456',
        vms: [{ id: 'vm-3', name: 'VM-Server2-01', state: 'running' }],
      });
    });

    it('should return servers with empty VMs array when no VMs are associated', async () => {
      // Arrange
      const serverWithoutVms = {
        ...mockServer1,
        vms: [],
      } as Server;
      serverRepository.findAllWithVms.mockResolvedValue([serverWithoutVms]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].vms).toEqual([]);
    });

    it('should return empty array when no servers exist', async () => {
      // Arrange
      serverRepository.findAllWithVms.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle servers with undefined VMs', async () => {
      // Arrange
      const serverWithUndefinedVms = {
        ...mockServer1,
        vms: undefined as any,
      } as Server;
      serverRepository.findAllWithVms.mockResolvedValue([
        serverWithUndefinedVms,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].vms).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      serverRepository.findAllWithVms.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(errorMessage);
    });

    it('should return ServerWithVmsResponseDto instances', async () => {
      // Arrange
      serverRepository.findAllWithVms.mockResolvedValue(mockServers);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((server) => {
        expect(server).toBeInstanceOf(ServerWithVmsResponseDto);
        expect(server).toHaveProperty('id');
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('ip');
        expect(server).toHaveProperty('hostMoid');
        expect(server).toHaveProperty('vms');
        expect(Array.isArray(server.vms)).toBe(true);
      });
    });
  });
});
