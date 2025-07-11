import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IloPermissionGuard } from './ilo-permission.guard';
import { GetServerByIloIpUseCase } from '@/modules/servers/application/use-cases/get-server-by-ilo-ip.use-case';
import { CheckServerPermissionUseCase } from '@/modules/servers/application/use-cases/check-server-permission.use-case';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';

describe('IloPermissionGuard', () => {
  let guard: IloPermissionGuard;
  let reflector: Reflector;
  let getServerByIloIpUseCase: GetServerByIloIpUseCase;
  let checkServerPermissionUseCase: CheckServerPermissionUseCase;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockGetServerByIloIpUseCase = {
    execute: jest.fn(),
  };

  const mockCheckServerPermissionUseCase = {
    execute: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn(),
    getHandler: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IloPermissionGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: GetServerByIloIpUseCase,
          useValue: mockGetServerByIloIpUseCase,
        },
        {
          provide: CheckServerPermissionUseCase,
          useValue: mockCheckServerPermissionUseCase,
        },
      ],
    }).compile();

    guard = module.get<IloPermissionGuard>(IloPermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    getServerByIloIpUseCase = module.get<GetServerByIloIpUseCase>(GetServerByIloIpUseCase);
    checkServerPermissionUseCase = module.get<CheckServerPermissionUseCase>(
      CheckServerPermissionUseCase,
    );

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true if no metadata is found', async () => {
      mockReflector.get.mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.get).toHaveBeenCalled();
    });

    it('should return false if no user is found in request', async () => {
      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.READ });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user: null,
        params: { ip: '192.168.1.100' },
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true if user is admin', async () => {
      const adminRole = new Role();
      adminRole.isAdmin = true;
      
      const adminUser = new User();
      adminUser.roles = [adminRole];

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.READ });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user: adminUser,
        params: { ip: '192.168.1.100' },
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockGetServerByIloIpUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if IP address is not provided', async () => {
      const user = new User();
      user.roles = [];

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.READ });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: {},
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('IP address is required'),
      );
    });

    it('should throw NotFoundException if server with iLO IP not found', async () => {
      const user = new User();
      user.roles = [];

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.READ });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: { ip: '192.168.1.100' },
      });
      mockGetServerByIloIpUseCase.execute.mockRejectedValue(
        new NotFoundException('Server with iLO IP 192.168.1.100 not found'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return true if user has required permission for specific server', async () => {
      const role = new Role();
      role.id = 'role-1';

      const user = new User();
      user.id = 'user-1';
      user.roles = [role];

      const ilo = new Ilo();
      ilo.ip = '192.168.1.100';

      const server = new Server();
      server.id = 'server-1';
      server.ilo = ilo;

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.READ });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: { ip: '192.168.1.100' },
      });
      mockGetServerByIloIpUseCase.execute.mockResolvedValue(server);
      mockCheckServerPermissionUseCase.execute.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockGetServerByIloIpUseCase.execute).toHaveBeenCalledWith('192.168.1.100');
      expect(mockCheckServerPermissionUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        'server-1',
        PermissionBit.READ,
      );
    });

    it('should return true if user has required permission for all servers', async () => {
      const role = new Role();
      role.id = 'role-1';

      const user = new User();
      user.id = 'user-1';
      user.roles = [role];

      const ilo = new Ilo();
      ilo.ip = '192.168.1.100';

      const server = new Server();
      server.id = 'server-1';
      server.ilo = ilo;

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.WRITE });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: { ip: '192.168.1.100' },
      });
      mockGetServerByIloIpUseCase.execute.mockResolvedValue(server);
      mockCheckServerPermissionUseCase.execute.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user lacks required permission', async () => {
      const role = new Role();
      role.id = 'role-1';

      const user = new User();
      user.id = 'user-1';
      user.roles = [role];

      const ilo = new Ilo();
      ilo.ip = '192.168.1.100';

      const server = new Server();
      server.id = 'server-1';
      server.ilo = ilo;

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.WRITE });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: { ip: '192.168.1.100' },
      });
      mockGetServerByIloIpUseCase.execute.mockResolvedValue(server);
      mockCheckServerPermissionUseCase.execute.mockResolvedValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to perform this action on this server',
        ),
      );
    });

    it('should check permissions with multiple roles', async () => {
      const role1 = new Role();
      role1.id = 'role-1';

      const role2 = new Role();
      role2.id = 'role-2';

      const user = new User();
      user.id = 'user-1';
      user.roles = [role1, role2];

      const ilo = new Ilo();
      ilo.ip = '192.168.1.100';

      const server = new Server();
      server.id = 'server-1';
      server.ilo = ilo;

      mockReflector.get.mockReturnValue({ requiredBit: PermissionBit.WRITE });
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
        user,
        params: { ip: '192.168.1.100' },
      });
      mockGetServerByIloIpUseCase.execute.mockResolvedValue(server);
      mockCheckServerPermissionUseCase.execute.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});