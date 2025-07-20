import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { ToggleUserStatusUseCase } from '../../use-cases';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { UserResponseDto } from '../../dto/user.response.dto';
import { User } from '../../../domain/entities/user.entity';
import {
  GetMeUseCase,
  GetUserByIdUseCase,
  GetUserCountUseCase,
  GetUserListUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  ResetPasswordUseCase,
  SoftDeleteUserUseCase,
  GetUserWithRoleUseCase,
  UpdateAccountUseCase,
  BulkActivateUseCase,
  CreateUserByAdminUseCase,
} from '../../use-cases';

describe('UserController - toggleUserStatus', () => {
  let controller: UserController;
  let toggleUserStatusUseCase: jest.Mocked<ToggleUserStatusUseCase>;

  const mockUser = (): User => {
    const user = {
      id: 'user-id',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashed',
      twoFactorSecret: null,
      isActive: true,
      isVerified: true,
      isTwoFactorEnabled: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
    } as User;
    return user;
  };

  const mockAdmin: JwtPayload = createMockJwtPayload({
    userId: 'admin-id',
    email: 'admin@example.com',
  });

  const mockRequest = {
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    get: jest.fn((header: string) => {
      if (header.toLowerCase() === 'user-agent') {
        return mockRequest.headers['user-agent'];
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: GetMeUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserListUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserCountUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ResetPasswordUseCase,
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
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetUserWithRoleUseCase,
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
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    toggleUserStatusUseCase = module.get(ToggleUserStatusUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /user/:id/toggle-status', () => {
    it('should successfully toggle user status', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.toggleUserStatus(
        'user-id',
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual(expectedResponse);
      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        requestContext: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should pass correct request context when headers are missing', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const requestWithoutHeaders = {
        ip: '10.0.0.1',
        headers: {},
        get: jest.fn(() => undefined),
      };

      await controller.toggleUserStatus(
        'user-id',
        mockAdmin,
        requestWithoutHeaders,
      );

      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        requestContext: {
          ip: '10.0.0.1',
          userAgent: 'unknown',
        },
      });
    });

    it('should handle different user IDs correctly', async () => {
      const user = mockUser();
      user.id = 'different-user-id';
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.toggleUserStatus(
        'different-user-id',
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual(expectedResponse);
      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'different-user-id',
        adminId: 'admin-id',
        requestContext: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle different admin IDs correctly', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const differentAdmin: JwtPayload = createMockJwtPayload({
        userId: 'different-admin-id',
        email: 'admin2@example.com',
      });

      await controller.toggleUserStatus('user-id', differentAdmin, mockRequest);

      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'user-id',
        adminId: 'different-admin-id',
        requestContext: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle null IP address', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const requestWithNullIp = {
        ip: null,
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
        get: jest.fn((header: string) => {
          if (header.toLowerCase() === 'user-agent') {
            return 'Mozilla/5.0';
          }
          return undefined;
        }),
      };

      await controller.toggleUserStatus(
        'user-id',
        mockAdmin,
        requestWithNullIp,
      );

      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        requestContext: {
          ip: 'unknown',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle empty user agent', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const requestWithEmptyUserAgent = {
        ip: '192.168.1.1',
        headers: {
          'user-agent': '',
        },
        get: jest.fn((header: string) => {
          if (header.toLowerCase() === 'user-agent') {
            return '';
          }
          return undefined;
        }),
      };

      await controller.toggleUserStatus(
        'user-id',
        mockAdmin,
        requestWithEmptyUserAgent,
      );

      expect(toggleUserStatusUseCase.execute).toHaveBeenCalledWith({
        targetUserId: 'user-id',
        adminId: 'admin-id',
        requestContext: {
          ip: '192.168.1.1',
          userAgent: '',
        },
      });
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Use case error');
      toggleUserStatusUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.toggleUserStatus('user-id', mockAdmin, mockRequest),
      ).rejects.toThrow('Use case error');
    });

    it('should handle UUID validation errors', async () => {
      const error = new Error('Validation failed');
      toggleUserStatusUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.toggleUserStatus('invalid-uuid', mockAdmin, mockRequest),
      ).rejects.toThrow('Validation failed');
    });

    it('should return UserResponseDto instance', async () => {
      const user = mockUser();
      const expectedResponse = new UserResponseDto(user);
      toggleUserStatusUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await controller.toggleUserStatus(
        'user-id',
        mockAdmin,
        mockRequest,
      );

      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });
});
