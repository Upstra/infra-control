import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetServerPrioritiesUseCase } from '../get-server-priorities.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { GetUserServerPermissionsUseCase } from '../../../../permissions/application/use-cases/permission-server';
import { PermissionBit } from '../../../../permissions/domain/value-objects/permission-bit.enum';

describe('GetServerPrioritiesUseCase', () => {
  let useCase: GetServerPrioritiesUseCase;
  let serverRepository: jest.Mocked<Repository<Server>>;
  let getUserPermissionServer: jest.Mocked<GetUserServerPermissionsUseCase>;

  const mockUserId = 'user-123';

  const mockServers = [
    {
      id: 'server-1',
      name: 'Server A',
      priority: 2,
      ip: '192.168.1.1',
      state: 'running',
    },
    {
      id: 'server-2',
      name: 'Server B',
      priority: 1,
      ip: '192.168.1.2',
      state: 'stopped',
    },
    {
      id: 'server-3',
      name: 'Server C',
      priority: 3,
      ip: '192.168.1.3',
      state: 'running',
    },
  ] as Server[];

  const mockPermissions = [
    { serverId: 'server-1', bitmask: PermissionBit.READ | PermissionBit.WRITE },
    { serverId: 'server-2', bitmask: PermissionBit.READ },
    {
      serverId: 'server-3',
      bitmask: PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE,
    },
    { serverId: 'server-4', bitmask: PermissionBit.WRITE }, // No READ permission
  ];

  beforeEach(async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServerPrioritiesUseCase,
        {
          provide: getRepositoryToken(Server),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
        {
          provide: GetUserServerPermissionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetServerPrioritiesUseCase>(
      GetServerPrioritiesUseCase,
    );
    serverRepository = module.get(getRepositoryToken(Server));
    getUserPermissionServer = module.get(GetUserServerPermissionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return servers with priorities ordered by priority then name', async () => {
      getUserPermissionServer.execute.mockResolvedValue(mockPermissions);

      const queryBuilder = serverRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockServers);

      const result = await useCase.execute(mockUserId);

      expect(getUserPermissionServer.execute).toHaveBeenCalledWith(mockUserId);
      expect(serverRepository.createQueryBuilder).toHaveBeenCalledWith(
        'server',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'server.id IN (:...ids)',
        { ids: ['server-1', 'server-2', 'server-3'] },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'server.priority',
        'ASC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'server.name',
        'ASC',
      );
      expect(queryBuilder.getMany).toHaveBeenCalled();

      expect(result).toEqual([
        {
          id: 'server-1',
          name: 'Server A',
          priority: 2,
          ipAddress: '192.168.1.1',
          state: 'running',
        },
        {
          id: 'server-2',
          name: 'Server B',
          priority: 1,
          ipAddress: '192.168.1.2',
          state: 'stopped',
        },
        {
          id: 'server-3',
          name: 'Server C',
          priority: 3,
          ipAddress: '192.168.1.3',
          state: 'running',
        },
      ]);
    });

    it('should filter servers by READ permission', async () => {
      const permissionsWithoutRead = [
        { serverId: 'server-1', bitmask: PermissionBit.WRITE },
        { serverId: 'server-2', bitmask: PermissionBit.DELETE },
        { serverId: 'server-3', bitmask: PermissionBit.READ },
      ];

      getUserPermissionServer.execute.mockResolvedValue(permissionsWithoutRead);

      const queryBuilder = serverRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([mockServers[2]]);

      const result = await useCase.execute(mockUserId);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'server.id IN (:...ids)',
        { ids: ['server-3'] },
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('server-3');
    });

    it('should return empty array when user has no permissions', async () => {
      getUserPermissionServer.execute.mockResolvedValue([]);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([]);
      expect(serverRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no READ permissions', async () => {
      const noReadPermissions = [
        { serverId: 'server-1', bitmask: PermissionBit.WRITE },
        { serverId: 'server-2', bitmask: PermissionBit.DELETE },
      ];

      getUserPermissionServer.execute.mockResolvedValue(noReadPermissions);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([]);
      expect(serverRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should handle servers with null values correctly', async () => {
      getUserPermissionServer.execute.mockResolvedValue([
        { serverId: 'server-1', bitmask: PermissionBit.READ },
      ]);

      const serverWithNulls = {
        id: 'server-1',
        name: 'Server A',
        priority: null,
        ip: null,
        state: null,
      } as any as Server;

      const queryBuilder = serverRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([serverWithNulls]);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([
        {
          id: 'server-1',
          name: 'Server A',
          priority: null,
          ipAddress: null,
          state: null,
        },
      ]);
    });

    it('should handle permission check with complex bitmasks', async () => {
      const complexPermissions = [
        { serverId: 'server-1', bitmask: 0 }, // No permissions
        {
          serverId: 'server-2',
          bitmask:
            PermissionBit.READ |
            PermissionBit.WRITE |
            PermissionBit.DELETE |
            PermissionBit.RESTART,
        },
        { serverId: 'server-3', bitmask: PermissionBit.READ },
      ];

      getUserPermissionServer.execute.mockResolvedValue(complexPermissions);

      const queryBuilder = serverRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([
        mockServers[1],
        mockServers[2],
      ]);

      const result = await useCase.execute(mockUserId);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'server.id IN (:...ids)',
        { ids: ['server-2', 'server-3'] },
      );
      expect(result).toHaveLength(2);
    });
  });
});
