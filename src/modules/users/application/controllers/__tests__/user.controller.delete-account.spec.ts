import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { SoftDeleteUserUseCase } from '../../use-cases/soft-delete-user.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { createMockJwtPayload } from '@/core/__mocks__/jwt-payload.mock';
import { DeletionReason } from '../../dto/delete-account.dto';
import {
  UserExceptions,
  UserNotFoundException,
  CannotDeleteOwnAccountException,
  CannotDeleteLastAdminException,
} from '../../../domain/exceptions/user.exception';
import {
  GetMeUseCase,
  GetUserByIdUseCase,
  GetUserCountUseCase,
  GetUserListUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  ResetPasswordUseCase,
  GetUserWithRoleUseCase,
  ToggleUserStatusUseCase,
  UpdateAccountUseCase,
  BulkActivateUseCase,
  CreateUserByAdminUseCase,
} from '../../use-cases';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { Reflector } from '@nestjs/core';

describe('UserController - deleteAccount', () => {
  let controller: UserController;
  let softDeleteUserUseCase: jest.Mocked<SoftDeleteUserUseCase>;

  const mockAdmin: JwtPayload = createMockJwtPayload({
    userId: 'admin-user-id',
    email: 'admin@test.com',
  });

  const mockRequest = {
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    get: (header: string) => {
      if (header.toLowerCase() === 'user-agent') {
        return 'Mozilla/5.0';
      }
      return undefined;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: GetMeUseCase,
          useValue: {},
        },
        {
          provide: GetUserByIdUseCase,
          useValue: {},
        },
        {
          provide: GetUserListUseCase,
          useValue: {},
        },
        {
          provide: GetUserCountUseCase,
          useValue: {},
        },
        {
          provide: UpdateUserUseCase,
          useValue: {},
        },
        {
          provide: ResetPasswordUseCase,
          useValue: {},
        },
        {
          provide: DeleteUserUseCase,
          useValue: {},
        },
        {
          provide: SoftDeleteUserUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetUserWithRoleUseCase,
          useValue: {},
        },
        {
          provide: ToggleUserStatusUseCase,
          useValue: {},
        },
        {
          provide: UpdateAccountUseCase,
          useValue: {},
        },
        {
          provide: BulkActivateUseCase,
          useValue: {},
        },
        {
          provide: CreateUserByAdminUseCase,
          useValue: {},
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    softDeleteUserUseCase = module.get(SoftDeleteUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /user/:id/delete-account', () => {
    it('should successfully delete a user account', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteAccount(
        'target-user-id',
        { reason: DeletionReason.ADMIN_ACTION },
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual({
        success: true,
        message: 'User account has been deleted',
      });

      expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
        'target-user-id',
        'admin-user-id',
        DeletionReason.ADMIN_ACTION,
        undefined,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should use default reason when not provided', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteAccount(
        'target-user-id',
        {},
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual({
        success: true,
        message: 'User account has been deleted',
      });

      expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
        'target-user-id',
        'admin-user-id',
        undefined,
        undefined,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should pass details when provided', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.deleteAccount(
        'target-user-id',
        {
          reason: DeletionReason.POLICY_VIOLATION,
          details: 'Multiple violations of terms of service',
        },
        mockAdmin,
        mockRequest,
      );

      expect(result).toEqual({
        success: true,
        message: 'User account has been deleted',
      });

      expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
        'target-user-id',
        'admin-user-id',
        DeletionReason.POLICY_VIOLATION,
        'Multiple violations of terms of service',
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should handle UserNotFoundException', async () => {
      softDeleteUserUseCase.execute.mockRejectedValue(
        UserExceptions.notFound('target-user-id'),
      );

      await expect(
        controller.deleteAccount('target-user-id', {}, mockAdmin, mockRequest),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should handle CannotDeleteOwnAccountException', async () => {
      softDeleteUserUseCase.execute.mockRejectedValue(
        UserExceptions.cannotDeleteOwnAccount(),
      );

      await expect(
        controller.deleteAccount('admin-user-id', {}, mockAdmin, mockRequest),
      ).rejects.toThrow(CannotDeleteOwnAccountException);
    });

    it('should handle CannotDeleteLastAdminException', async () => {
      softDeleteUserUseCase.execute.mockRejectedValue(
        UserExceptions.cannotDeleteLastAdmin(),
      );

      await expect(
        controller.deleteAccount('target-user-id', {}, mockAdmin, mockRequest),
      ).rejects.toThrow(CannotDeleteLastAdminException);
    });

    it('should handle request without IP address', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const requestWithoutIp = {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
        get: (header: string) => {
          if (header.toLowerCase() === 'user-agent') {
            return 'Mozilla/5.0';
          }
          return undefined;
        },
      };

      await controller.deleteAccount(
        'target-user-id',
        {},
        mockAdmin,
        requestWithoutIp,
      );

      expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
        'target-user-id',
        'admin-user-id',
        undefined,
        undefined,
        'unknown',
        'Mozilla/5.0',
      );
    });

    it('should handle request without user agent', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const requestWithoutUserAgent = {
        ip: '192.168.1.1',
        headers: {},
        get: (_header: string) => undefined,
      };

      await controller.deleteAccount(
        'target-user-id',
        {},
        mockAdmin,
        requestWithoutUserAgent,
      );

      expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
        'target-user-id',
        'admin-user-id',
        undefined,
        undefined,
        '192.168.1.1',
        'unknown',
      );
    });

    it('should handle all deletion reasons', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const reasons = [
        DeletionReason.ADMIN_ACTION,
        DeletionReason.USER_REQUEST,
        DeletionReason.POLICY_VIOLATION,
        DeletionReason.INACTIVE_ACCOUNT,
        DeletionReason.OTHER,
      ];

      for (const reason of reasons) {
        await controller.deleteAccount(
          'target-user-id',
          { reason },
          mockAdmin,
          mockRequest,
        );

        expect(softDeleteUserUseCase.execute).toHaveBeenCalledWith(
          'target-user-id',
          'admin-user-id',
          reason,
          undefined,
          '192.168.1.1',
          'Mozilla/5.0',
        );
      }
    });
  });
});
