import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { SoftDeleteUserUseCase } from '../../use-cases/soft-delete-user.use-case';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { DeletionReason } from '../../dto/delete-account.dto';
import {
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
} from '../../use-cases';

describe('UserController - deleteAccount', () => {
  let controller: UserController;
  let softDeleteUserUseCase: jest.Mocked<SoftDeleteUserUseCase>;

  const mockAdmin: JwtPayload = {
    userId: 'admin-user-id',
    email: 'admin@test.com',
  };

  const mockRequest = {
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
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
      ],
    }).compile();

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
        DeletionReason.ADMIN_ACTION,
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
        new UserNotFoundException('target-user-id'),
      );

      await expect(
        controller.deleteAccount(
          'target-user-id',
          {},
          mockAdmin,
          mockRequest,
        ),
      ).rejects.toThrow(UserNotFoundException);
    });

    it('should handle CannotDeleteOwnAccountException', async () => {
      softDeleteUserUseCase.execute.mockRejectedValue(
        new CannotDeleteOwnAccountException(),
      );

      await expect(
        controller.deleteAccount(
          'admin-user-id',
          {},
          mockAdmin,
          mockRequest,
        ),
      ).rejects.toThrow(CannotDeleteOwnAccountException);
    });

    it('should handle CannotDeleteLastAdminException', async () => {
      softDeleteUserUseCase.execute.mockRejectedValue(
        new CannotDeleteLastAdminException(),
      );

      await expect(
        controller.deleteAccount(
          'target-user-id',
          {},
          mockAdmin,
          mockRequest,
        ),
      ).rejects.toThrow(CannotDeleteLastAdminException);
    });

    it('should handle request without IP address', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const requestWithoutIp = {
        headers: {
          'user-agent': 'Mozilla/5.0',
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
        DeletionReason.ADMIN_ACTION,
        undefined,
        undefined,
        'Mozilla/5.0',
      );
    });

    it('should handle request without user agent', async () => {
      softDeleteUserUseCase.execute.mockResolvedValue(undefined);

      const requestWithoutUserAgent = {
        ip: '192.168.1.1',
        headers: {},
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
        DeletionReason.ADMIN_ACTION,
        undefined,
        '192.168.1.1',
        undefined,
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