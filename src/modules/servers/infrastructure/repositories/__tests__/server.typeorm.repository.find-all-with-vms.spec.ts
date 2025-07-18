import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ServerTypeormRepository } from '../server.typeorm.repository';
import { Server } from '../../../domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { ServerRetrievalException } from '../../../domain/exceptions/server.exception';

describe('ServerTypeormRepository - findAllWithVms', () => {
  let repository: ServerTypeormRepository;
  let dataSource: jest.Mocked<DataSource>;
  let queryBuilder: any;

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

  const mockServers: Server[] = [
    {
      id: 'server-1',
      name: 'ESXi-Server-01',
      ip: '192.168.1.10',
      state: 'UP',
      vms: [mockVm1, mockVm2],
    } as Server,
    {
      id: 'server-2',
      name: 'ESXi-Server-02',
      ip: '192.168.1.20',
      state: 'UP',
      vms: [],
    } as Server,
  ];

  beforeEach(async () => {
    // Mock QueryBuilder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    // Mock DataSource
    const mockEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    dataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerTypeormRepository,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<ServerTypeormRepository>(ServerTypeormRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWithVms', () => {
    it('should return all servers with their VMs', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue(mockServers);

      // Act
      const result = await repository.findAllWithVms();

      // Assert
      expect(result).toEqual(mockServers);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'server.vms',
        'vms',
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('server.name', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('vms.name', 'ASC');
      expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no servers exist', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findAllWithVms();

      // Assert
      expect(result).toEqual([]);
      expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
    });

    it('should return servers with empty VMs arrays', async () => {
      // Arrange
      const serversWithoutVms = [
        {
          id: 'server-1',
          name: 'ESXi-Server-01',
          ip: '192.168.1.10',
          state: 'UP',
          vms: [],
        } as Server,
      ];
      queryBuilder.getMany.mockResolvedValue(serversWithoutVms);

      // Act
      const result = await repository.findAllWithVms();

      // Assert
      expect(result).toEqual(serversWithoutVms);
      expect(result[0].vms).toEqual([]);
    });

    it('should properly order results by server name then VM name', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue(mockServers);

      // Act
      await repository.findAllWithVms();

      // Assert
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('server.name', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('vms.name', 'ASC');
    });

    it('should use correct join for VMs', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue(mockServers);

      // Act
      await repository.findAllWithVms();

      // Assert
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'server.vms',
        'vms',
      );
    });

    it('should build query in correct order', async () => {
      // Arrange
      queryBuilder.getMany.mockResolvedValue(mockServers);

      // Act
      await repository.findAllWithVms();

      // Assert
      const calls = queryBuilder.leftJoinAndSelect.mock.invocationCallOrder;
      const orderByCalls = queryBuilder.orderBy.mock.invocationCallOrder;
      const addOrderByCalls = queryBuilder.addOrderBy.mock.invocationCallOrder;
      const getManyCall = queryBuilder.getMany.mock.invocationCallOrder;

      // Verify call order
      expect(calls[0]).toBeLessThan(orderByCalls[0]);
      expect(orderByCalls[0]).toBeLessThan(addOrderByCalls[0]);
      expect(addOrderByCalls[0]).toBeLessThan(getManyCall[0]);
    });

    it('should throw ServerRetrievalException when database query fails', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');
      queryBuilder.getMany.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(repository.findAllWithVms()).rejects.toThrow(
        ServerRetrievalException,
      );
      await expect(repository.findAllWithVms()).rejects.toThrow(
        'Error retrieving servers with VMs',
      );
    });

    it('should handle complex server-VM relationships', async () => {
      // Arrange
      const complexServers = [
        {
          id: 'server-1',
          name: 'ESXi-Server-01',
          vms: [
            { id: 'vm-1', name: 'VM-A', state: 'running' },
            { id: 'vm-2', name: 'VM-B', state: 'stopped' },
            { id: 'vm-3', name: 'VM-C', state: 'suspended' },
          ],
        } as Server,
        {
          id: 'server-2',
          name: 'ESXi-Server-02',
          vms: [{ id: 'vm-4', name: 'VM-D', state: 'running' }],
        } as Server,
        {
          id: 'server-3',
          name: 'ESXi-Server-03',
          vms: [], // No VMs
        } as Server,
      ];
      queryBuilder.getMany.mockResolvedValue(complexServers);

      // Act
      const result = await repository.findAllWithVms();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].vms).toHaveLength(3);
      expect(result[1].vms).toHaveLength(1);
      expect(result[2].vms).toHaveLength(0);
    });

    it('should handle servers with null VMs relationship', async () => {
      // Arrange
      const serverWithNullVms = [
        {
          id: 'server-1',
          name: 'ESXi-Server-01',
          vms: null, // null instead of empty array
        } as any,
      ];
      queryBuilder.getMany.mockResolvedValue(serverWithNullVms);

      // Act
      const result = await repository.findAllWithVms();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].vms).toBeNull();
    });

    it('should use createQueryBuilder with correct entity', async () => {
      // Arrange
      const mockEntityManager = dataSource.createEntityManager();
      queryBuilder.getMany.mockResolvedValue(mockServers);

      // Act
      await repository.findAllWithVms();

      // Assert
      expect(mockEntityManager.createQueryBuilder).toHaveBeenCalledWith(
        'server',
      );
    });
  });
});
