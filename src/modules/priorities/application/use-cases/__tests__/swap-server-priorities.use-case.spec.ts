import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SwapServerPrioritiesUseCase } from '../swap-server-priorities.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { GetUserServerPermissionsUseCase } from '../../../../permissions/application/use-cases/permission-server';
import { LogHistoryUseCase } from '../../../../history/application/use-cases';
import { PermissionBit } from '../../../../permissions/domain/value-objects/permission-bit.enum';

describe('SwapServerPrioritiesUseCase', () => {
  let useCase: SwapServerPrioritiesUseCase;
  let getUserPermissionServer: jest.Mocked<GetUserServerPermissionsUseCase>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;
  let dataSource: jest.Mocked<DataSource>;
  let entityManager: jest.Mocked<EntityManager>;
  let transactionalRepository: jest.Mocked<Repository<Server>>;

  const mockUserId = 'user-123';
  const server1Id = 'server-1';
  const server2Id = 'server-2';

  const mockServer1 = {
    id: server1Id,
    name: 'Server 1',
    priority: 1,
  } as Server;

  const mockServer2 = {
    id: server2Id,
    name: 'Server 2',
    priority: 2,
  } as Server;

  beforeEach(async () => {
    transactionalRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    entityManager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepository),
    } as any;

    dataSource = {
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapServerPrioritiesUseCase,
        {
          provide: getRepositoryToken(Server),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GetUserServerPermissionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
            executeStructured: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    useCase = module.get<SwapServerPrioritiesUseCase>(
      SwapServerPrioritiesUseCase,
    );
    getUserPermissionServer = module.get(GetUserServerPermissionsUseCase);
    logHistory = module.get(LogHistoryUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(
        async (runInTransaction: any) => {
          return runInTransaction(entityManager);
        },
      );
    });

    it('should successfully swap priorities between two servers', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockServer1);
      transactionalRepository.findOne.mockResolvedValueOnce(mockServer2);
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(server1Id, server2Id, mockUserId);

      expect(getUserPermissionServer.execute).toHaveBeenCalledWith(mockUserId);
      expect(transactionalRepository.findOne).toHaveBeenCalledWith({
        where: { id: server1Id },
      });
      expect(transactionalRepository.findOne).toHaveBeenCalledWith({
        where: { id: server2Id },
      });
      expect(transactionalRepository.save).toHaveBeenCalledWith([
        { ...mockServer1, priority: 2 },
        { ...mockServer2, priority: 1 },
      ]);
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'server',
        entityId: server1Id,
        action: 'PRIORITY_SWAP',
        userId: mockUserId,
        oldValue: { priority: 1 },
        newValue: { priority: 2 },
        metadata: {
          swapPartner: server2Id,
          swapPartnerName: 'Server 2',
          oldPriority: 1,
          newPriority: 2,
        },
      });
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'server',
        entityId: server2Id,
        action: 'PRIORITY_SWAP',
        userId: mockUserId,
        oldValue: { priority: 2 },
        newValue: { priority: 1 },
        metadata: {
          swapPartner: server1Id,
          swapPartnerName: 'Server 1',
          oldPriority: 2,
          newPriority: 1,
        },
      });
      expect(result).toEqual({
        server1: { id: server1Id, priority: 2 },
        server2: { id: server2Id, priority: 1 },
      });
    });

    it('should throw ForbiddenException when user lacks WRITE permission on server1', async () => {
      const permissions = [
        { serverId: server1Id, bitmask: PermissionBit.READ }, // No WRITE
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have write permissions on both servers',
        ),
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user lacks WRITE permission on server2', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        { serverId: server2Id, bitmask: PermissionBit.READ }, // No WRITE
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have write permissions on both servers',
        ),
      );
    });

    it('should throw ForbiddenException when user has no permission on server1', async () => {
      const permissions = [
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have write permissions on both servers',
        ),
      );
    });

    it('should throw ForbiddenException when user has no permissions at all', async () => {
      getUserPermissionServer.execute.mockResolvedValue([]);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have write permissions on both servers',
        ),
      );
    });

    it('should throw NotFoundException when server1 does not exist', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new NotFoundException(`Server with id "${server1Id}" not found`),
      );
    });

    it('should throw NotFoundException when server2 does not exist', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockServer1);
      transactionalRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow(
        new NotFoundException(`Server with id "${server2Id}" not found`),
      );
    });

    it('should handle swapping servers with same priority', async () => {
      const samePriorityServer1 = { ...mockServer1, priority: 5 };
      const samePriorityServer2 = { ...mockServer2, priority: 5 };

      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(
        samePriorityServer1 as Server,
      );
      transactionalRepository.findOne.mockResolvedValueOnce(
        samePriorityServer2 as Server,
      );
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(server1Id, server2Id, mockUserId);

      expect(result).toEqual({
        server1: { id: server1Id, priority: 5 },
        server2: { id: server2Id, priority: 5 },
      });
    });

    it('should handle swapping with complex permission bitmasks', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask:
            PermissionBit.READ |
            PermissionBit.WRITE |
            PermissionBit.DELETE |
            PermissionBit.RESTART |
            PermissionBit.SHUTDOWN |
            PermissionBit.SNAPSHOT,
        }, // All permissions
        {
          serverId: server2Id,
          bitmask: PermissionBit.WRITE | PermissionBit.DELETE,
        }, // WRITE + DELETE
      ];

      // Create mutable copies that will be mutated by the use case
      const server1Mock = { ...mockServer1, priority: 1 };
      const server2Mock = { ...mockServer2, priority: 2 };

      getUserPermissionServer.execute.mockResolvedValue(permissions);

      // Return the mocks that will be mutated
      transactionalRepository.findOne
        .mockResolvedValueOnce(server1Mock as Server)
        .mockResolvedValueOnce(server2Mock as Server);

      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(server1Id, server2Id, mockUserId);

      // The mocks should have been mutated
      expect(server1Mock.priority).toBe(2);
      expect(server2Mock.priority).toBe(1);

      // And the result should reflect the swapped values
      expect(result).toEqual({
        server1: { id: server1Id, priority: 2 },
        server2: { id: server2Id, priority: 1 },
      });
    });

    it('should handle null priorities correctly', async () => {
      const nullPriorityServer1 = { ...mockServer1, priority: null } as any;
      const nullPriorityServer2 = { ...mockServer2, priority: null } as any;

      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(
        nullPriorityServer1 as Server,
      );
      transactionalRepository.findOne.mockResolvedValueOnce(
        nullPriorityServer2 as Server,
      );
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(server1Id, server2Id, mockUserId);

      expect(result).toEqual({
        server1: { id: server1Id, priority: null },
        server2: { id: server2Id, priority: null },
      });
    });

    it('should rollback transaction on error', async () => {
      const permissions = [
        {
          serverId: server1Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
        {
          serverId: server2Id,
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockServer1);
      transactionalRepository.findOne.mockResolvedValueOnce(mockServer2);
      transactionalRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        useCase.execute(server1Id, server2Id, mockUserId),
      ).rejects.toThrow('Database error');

      // Verify that logHistory was not called since transaction rolled back
      expect(logHistory.executeStructured).not.toHaveBeenCalled();
    });
  });
});
