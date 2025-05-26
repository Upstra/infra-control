import { Test, TestingModule } from '@nestjs/testing';
import { Get2FAStatusUseCase } from '../use-cases/get-2fa-status.use-case';
import { Generate2FAUseCase } from '../use-cases/generate-2fa.use-case';
import { Verify2FAUseCase } from '../use-cases/verify-2fa.use-case';
import { Disable2FAUseCase } from '../use-cases/disable-2fa.use-case';
import { TwoFADisableResponseDto, TwoFADto } from '../dto/twofa.dto';
import { TwoFAController } from './twofa.controller';
import { Verify2FARecoveryUseCase } from '../use-cases/verify-2fa-recovery.use-case';

describe('TwoFAController', () => {
  let controller: TwoFAController;

  const get2FAStatusUseCase = { execute: jest.fn() };
  const generate2FAUseCase = { execute: jest.fn() };
  const verify2FAUseCase = { execute: jest.fn() };
  const disable2FAUseCase = {
    execute: jest.fn().mockResolvedValue(new TwoFADisableResponseDto(true)),
  };
  const verify2FARecoveryUseCase = { execute: jest.fn() };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwoFAController],
      providers: [
        { provide: Get2FAStatusUseCase, useValue: get2FAStatusUseCase },
        { provide: Generate2FAUseCase, useValue: generate2FAUseCase },
        { provide: Verify2FAUseCase, useValue: verify2FAUseCase },
        { provide: Disable2FAUseCase, useValue: disable2FAUseCase },
        {
          provide: Verify2FARecoveryUseCase,
          useValue: verify2FARecoveryUseCase,
        },
      ],
    }).compile();

    controller = module.get<TwoFAController>(TwoFAController);
  });

  it('should call login use case with dto', async () => {
    await controller.get2FAStatus({
      email: 'john@example.com',
      userId: 'id123',
    });
    expect(get2FAStatusUseCase.execute).toHaveBeenCalledWith(
      'john@example.com',
    );
  });

  it('should call get2FAStatus with user email', async () => {
    const mockUser = { email: 'john@example.com', userId: 'id123' };
    await controller.verify(mockUser, { code: '123456' });
    expect(get2FAStatusUseCase.execute).toHaveBeenCalledWith(
      'john@example.com',
    );
  });

  it('should disable 2FA', async () => {
    const mockUser = { email: 'john@example.com', userId: 'id123' };
    await expect(controller.disable(mockUser)).resolves.toEqual(
      expect.objectContaining({
        isDisabled: true,
        message: '2FA has been disabled successfully.',
      }),
    );
  });

  it('should call verify 2FA with payload and dto', async () => {
    const user = { email: 'john@example.com', userId: 'id123' };
    const dto: TwoFADto = { code: '123456' };
    await controller.verify(user, dto);
    expect(verify2FAUseCase.execute).toHaveBeenCalledWith(user, dto);
  });

  it('should call disable 2FA with only user payload', async () => {
    const user = { email: 'john@example.com', userId: 'id123' };
    await controller.disable(user);
    expect(disable2FAUseCase.execute).toHaveBeenCalledWith(user);
  });
});
