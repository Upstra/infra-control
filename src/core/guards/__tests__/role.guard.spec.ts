import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from '../role.guard';
import { GetUserWithRoleUseCase } from '@/modules/users/application/use-cases/get-user-with-role.use-case';
import { User } from '@/modules/users/domain/entities/user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;
  let getUserWithRoleUseCase: GetUserWithRoleUseCase;

  const mockExecutionContext = (user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
    }) as ExecutionContext;

  const mockUserWithRole = (canCreateServer: boolean): User =>
    ({
      id: 'user-123',
      username: 'testuser',
      roles: [
        {
          id: 'role-123',
          name: 'test-role',
          canCreateServer,
        } as Role,
      ],
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: GetUserWithRoleUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);
    getUserWithRoleUseCase = module.get<GetUserWithRoleUseCase>(
      GetUserWithRoleUseCase,
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no requirement is set', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(getUserWithRoleUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ canCreateServer: true });

      const context = mockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('should throw ForbiddenException when user has no role', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ canCreateServer: true });
      jest.spyOn(getUserWithRoleUseCase, 'execute').mockResolvedValue({
        id: 'user-123',
        roles: [],
      } as User);

      const context = mockExecutionContext({ userId: 'user-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User has no role assigned'),
      );
    });

    it('should allow access when user has required permission', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ canCreateServer: true });
      jest
        .spyOn(getUserWithRoleUseCase, 'execute')
        .mockResolvedValue(mockUserWithRole(true));

      const context = mockExecutionContext({ userId: 'user-123' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(getUserWithRoleUseCase.execute).toHaveBeenCalledWith('user-123');
    });

    it('should deny access when user lacks required permission', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ canCreateServer: true });
      jest
        .spyOn(getUserWithRoleUseCase, 'execute')
        .mockResolvedValue(mockUserWithRole(false));

      const context = mockExecutionContext({ userId: 'user-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('You do not have permission to create servers'),
      );
    });

    it('should handle inverse permission requirement', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue({ canCreateServer: false });
      jest
        .spyOn(getUserWithRoleUseCase, 'execute')
        .mockResolvedValue(mockUserWithRole(true));

      const context = mockExecutionContext({ userId: 'user-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'This action requires NOT having server creation permission',
        ),
      );
    });
  });
});
