import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { ResetPasswordUseCase } from '../../use-cases';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { ResetPasswordDto } from '../../dto';
import { UserResponseDto } from '../../dto/user.response.dto';
import { RequestContextDto } from '@/core/dto';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import {
  GetMeUseCase,
  GetUserByIdUseCase,
  GetUserCountUseCase,
  GetUserListUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  SoftDeleteUserUseCase,
  ToggleUserStatusUseCase,
  UpdateAccountUseCase,
  BulkActivateUseCase,
  CreateUserByAdminUseCase,
  GetUserWithRoleUseCase,
} from '../../use-cases';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';

describe('UserController - Reset Password', () => {
  let controller: UserController;
  let resetPasswordUseCase: jest.Mocked<ResetPasswordUseCase>;

  const mockUser = createMockUser();
  const mockUserResponse = new UserResponseDto(mockUser);
  const mockJwtPayload: JwtPayload = createMockJwtPayload({
    userId: 'user-123',
    email: 'user@example.com',
  });

  const mockRequest = {
    ip: '192.168.1.1',
    socket: { remoteAddress: '192.168.1.1' },
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'Mozilla/5.0';
      return undefined;
    }),
    sessionID: 'session-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: ResetPasswordUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetMeUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserCountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserListUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: SoftDeleteUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ToggleUserStatusUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateAccountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: BulkActivateUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CreateUserByAdminUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserWithRoleUseCase,
          useValue: { execute: jest.fn() },
        },
        Reflector,
        {
          provide: APP_GUARD,
          useValue: {},
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: RoleGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UserController>(UserController);
    resetPasswordUseCase = module.get(ResetPasswordUseCase);
  });

  describe('resetCurrentUserPassword', () => {
    it('should reset current user password with request context', async () => {
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      const result = await controller.resetCurrentUserPassword(
        mockJwtPayload,
        dto,
        mockRequest,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        mockJwtPayload.userId,
        dto,
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle missing IP address gracefully', async () => {
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };

      const requestWithoutIp = {
        ip: undefined,
        socket: { remoteAddress: undefined },
        get: jest.fn(() => 'Mozilla/5.0'),
      };

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      await controller.resetCurrentUserPassword(
        mockJwtPayload,
        dto,
        requestWithoutIp,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        mockJwtPayload.userId,
        dto,
        expect.objectContaining({
          ipAddress: 'unknown',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('should handle missing user agent gracefully', async () => {
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };

      const requestWithoutUserAgent = {
        ...mockRequest,
        get: jest.fn(() => undefined),
      };

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      await controller.resetCurrentUserPassword(
        mockJwtPayload,
        dto,
        requestWithoutUserAgent,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        mockJwtPayload.userId,
        dto,
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'unknown',
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset user password by admin with request context', async () => {
      const targetUserId = 'target-user-123';
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };
      const adminPayload: JwtPayload = createMockJwtPayload({
        userId: 'admin-123',
        email: 'admin@example.com',
      });

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      const result = await controller.resetPassword(
        targetUserId,
        dto,
        adminPayload,
        mockRequest,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        targetUserId,
        dto,
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
        adminPayload.userId,
      );
      expect(result).toEqual(mockUserResponse);
    });

    it('should create proper request context from request', async () => {
      const targetUserId = 'target-user-123';
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };
      const adminPayload: JwtPayload = createMockJwtPayload({
        userId: 'admin-123',
        email: 'admin@example.com',
      });

      const complexRequest = {
        ip: '10.0.0.1',
        socket: { remoteAddress: '10.0.0.2' },
        get: jest.fn((header: string) => {
          if (header === 'User-Agent')
            return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
          return undefined;
        }),
        sessionID: 'complex-session-456',
      };

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      await controller.resetPassword(
        targetUserId,
        dto,
        adminPayload,
        complexRequest,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        targetUserId,
        dto,
        expect.objectContaining({
          ipAddress: '10.0.0.1',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          sessionId: 'complex-session-456',
        }),
        adminPayload.userId,
      );
    });

    it('should fallback to socket remote address when ip is not available', async () => {
      const targetUserId = 'target-user-123';
      const dto: ResetPasswordDto = {
        newPassword: 'NewSecurePassword123!',
      };
      const adminPayload: JwtPayload = createMockJwtPayload({
        userId: 'admin-123',
        email: 'admin@example.com',
      });

      const requestWithSocketIp = {
        ip: undefined,
        socket: { remoteAddress: '172.16.0.1' },
        get: jest.fn(() => 'Safari/605.1.15'),
      };

      resetPasswordUseCase.execute.mockResolvedValue(mockUserResponse);

      await controller.resetPassword(
        targetUserId,
        dto,
        adminPayload,
        requestWithSocketIp,
      );

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith(
        targetUserId,
        dto,
        expect.objectContaining({
          ipAddress: '172.16.0.1',
          userAgent: 'Safari/605.1.15',
        }),
        adminPayload.userId,
      );
    });
  });

  describe('RequestContextDto.fromRequest', () => {
    it('should correctly extract all request information', () => {
      const context = RequestContextDto.fromRequest(mockRequest);

      expect(context).toEqual(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session-123',
        }),
      );
    });

    it('should handle edge cases gracefully', () => {
      const minimalRequest = {
        get: jest.fn(() => undefined),
      };
      const context = RequestContextDto.fromRequest(minimalRequest);

      expect(context).toEqual(
        expect.objectContaining({
          ipAddress: 'unknown',
          userAgent: 'unknown',
          sessionId: undefined,
        }),
      );
    });
  });
});
