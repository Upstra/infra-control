import { Test, TestingModule } from '@nestjs/testing';
import { GetUserServersWithMetricsUseCase } from '../get-user-servers-with-metrics.use-case';
import { GetServerStatusUseCase } from '@/modules/ilos/application/use-cases/get-server-status.use-case';
import { ServerListResponseDto } from '../../dto/server.list.response.dto';
import {
  IloStatusResponseDto,
  IloServerStatus,
} from '@/modules/ilos/application/dto/ilo-status.dto';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionResolver } from '@/modules/permissions/application/utils/permission-resolver.util';
import { PermissionSet } from '@/modules/permissions/domain/value-objects/ permission-set.value-object';

jest.mock('@/modules/permissions/application/utils/permission-resolver.util');

describe('GetUserServersWithMetricsUseCase', () => {
  let useCase: GetUserServersWithMetricsUseCase;
  let userRepo: any;
  let permissionRepo: any;
  let serverRepo: any;
  let getServerStatusUseCase: GetServerStatusUseCase;

  const mockUser = {
    id: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password',
    roles: [
      {
        id: 'role-id',
        name: 'user',
        isAdmin: false,
      } as Role,
    ],
  } as User;

  const mockAdminUser = {
    ...mockUser,
    roles: [
      {
        id: 'admin-role-id',
        name: 'admin',
        isAdmin: true,
      } as Role,
    ],
  } as User;

  const mockServer = {
    id: 'server-id',
    name: 'Test Server',
    state: 'running',
    ip: '192.168.1.1',
    type: 'esxi',
    adminUrl: 'https://192.168.1.1',
    priority: 1,
    roomId: 'room-id',
    login: 'admin',
    password: 'password',
    iloId: 'ilo-id',
    ilo: {
      id: 'ilo-id',
      ip: '192.168.1.2',
      login: 'ilo-admin',
      password: 'ilo-password',
      serverId: 'server-id',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Server;

  const mockIloStatus: Partial<IloStatusResponseDto> = {
    status: IloServerStatus.ON,
    ip: '192.168.1.2',
    serverId: 'server-id',
    serverName: 'Test Server',
    serverType: 'esxi',
    vmwareHostMoid: 'host-123',
    serverState: 'running',
    serverPriority: 1,
    roomId: 'room-id',
    metrics: {
      powerState: 'on',
      cpuUsage: 45,
      memoryUsage: 60,
      uptime: 3600,
    } as any,
  };

  beforeEach(async () => {
    userRepo = {
      findOneByField: jest.fn(),
    };

    permissionRepo = {};

    serverRepo = {
      findAll: jest.fn(),
      findAllByFieldPaginated: jest.fn(),
    };

    const mockGetServerStatusUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserServersWithMetricsUseCase,
        {
          provide: 'UserRepositoryInterface',
          useValue: userRepo,
        },
        {
          provide: 'PermissionServerRepositoryInterface',
          useValue: permissionRepo,
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: serverRepo,
        },
        {
          provide: GetServerStatusUseCase,
          useValue: mockGetServerStatusUseCase,
        },
      ],
    }).compile();

    useCase = module.get<GetUserServersWithMetricsUseCase>(
      GetUserServersWithMetricsUseCase,
    );
    getServerStatusUseCase = module.get<GetServerStatusUseCase>(
      GetServerStatusUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return empty list when user has no roles', async () => {
      userRepo.findOneByField.mockResolvedValue({
        ...mockUser,
        roles: [],
      });

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should return all servers for admin user without metrics', async () => {
      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockResolvedValue([mockServer]);

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('server-id');
      expect(result.items[0].metrics).toBeUndefined();
      expect(getServerStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return all servers for admin user with metrics', async () => {
      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockResolvedValue([mockServer]);
      (getServerStatusUseCase.execute as jest.Mock).mockResolvedValue(
        mockIloStatus,
      );

      const result = await useCase.execute('user-id', 1, 10, true);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].metrics).toBeDefined();
      expect(result.items[0].metrics?.powerState).toBe('on');
      expect(result.items[0].metrics?.health).toBe('unknown');
      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(
        'server-id',
        false,
      );
    });

    it('should return paginated servers for non-admin user without metrics', async () => {
      userRepo.findOneByField.mockResolvedValue(mockUser);
      serverRepo.findAllByFieldPaginated.mockResolvedValue([[mockServer], 1]);

      const mockPermissions = [
        {
          id: 'perm-id',
          roleId: 'role-id',
          serverId: 'server-id',
          permissions: PermissionBit.READ,
        },
      ];

      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue(mockPermissions);

      jest.spyOn(PermissionSet.prototype, 'filterByBit').mockReturnValue({
        getAccessibleResourceIds: () => ['server-id'],
      } as any);

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('server-id');
      expect(result.items[0].metrics).toBeUndefined();
      expect(getServerStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return paginated servers for non-admin user with metrics', async () => {
      userRepo.findOneByField.mockResolvedValue(mockUser);
      serverRepo.findAllByFieldPaginated.mockResolvedValue([[mockServer], 1]);
      (getServerStatusUseCase.execute as jest.Mock).mockResolvedValue(
        mockIloStatus,
      );

      const mockPermissions = [
        {
          id: 'perm-id',
          roleId: 'role-id',
          serverId: 'server-id',
          permissions: PermissionBit.READ,
        },
      ];

      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue(mockPermissions);

      jest.spyOn(PermissionSet.prototype, 'filterByBit').mockReturnValue({
        getAccessibleResourceIds: () => ['server-id'],
      } as any);

      const result = await useCase.execute('user-id', 1, 10, true);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].metrics).toBeDefined();
      expect(result.items[0].metrics?.powerState).toBe('on');
      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(
        'server-id',
        false,
      );
    });

    it('should handle server without iLO when includeMetrics is true', async () => {
      const serverWithoutIlo = {
        ...mockServer,
        ilo: undefined,
        iloId: undefined,
      };

      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockResolvedValue([serverWithoutIlo]);

      const result = await useCase.execute('user-id', 1, 10, true);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].metrics).toBeUndefined();
      expect(getServerStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle iLO metrics fetch error gracefully', async () => {
      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockResolvedValue([mockServer]);
      (getServerStatusUseCase.execute as jest.Mock).mockRejectedValue(
        new Error('iLO connection failed'),
      );

      const result = await useCase.execute('user-id', 1, 10, true);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].metrics).toBeUndefined();
      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(
        'server-id',
        false,
      );
    });

    it('should return empty list when user has no readable permissions', async () => {
      userRepo.findOneByField.mockResolvedValue(mockUser);

      const mockPermissions = [
        {
          id: 'perm-id',
          roleId: 'role-id',
          serverId: 'server-id',
          permissions: PermissionBit.WRITE, // Not READ
        },
      ];

      (
        PermissionResolver.resolveServerPermissions as jest.Mock
      ).mockResolvedValue(mockPermissions);

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const servers = Array.from({ length: 15 }, (_, i) => ({
        ...mockServer,
        id: `server-${i}`,
        name: `Server ${i}`,
      }));

      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockResolvedValue(servers);

      const result = await useCase.execute('user-id', 2, 10, false);

      expect(result.items).toHaveLength(5); // 15 total, page 2 with 10 per page
      expect(result.items[0].id).toBe('server-10');
      expect(result.totalItems).toBe(15);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should handle repository errors gracefully', async () => {
      userRepo.findOneByField.mockResolvedValue(mockAdminUser);
      serverRepo.findAll.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should handle null user gracefully', async () => {
      userRepo.findOneByField.mockResolvedValue(null);

      const result = await useCase.execute('user-id', 1, 10, false);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
    });
  });
});
