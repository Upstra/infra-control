import { Test, TestingModule } from '@nestjs/testing';
import { PresenceController } from '../presence.controller';

import { GetUserByIdUseCase } from '@/modules/users/application/use-cases';
import { createMockUserDto } from '@/modules/auth/__mocks__/user.mock';
import { PresenceService } from '../../services/presence.service';

describe('PresenceController', () => {
  let controller: PresenceController;
  let presenceService: jest.Mocked<PresenceService>;
  let getUserByIdUseCase: jest.Mocked<GetUserByIdUseCase>;

  beforeEach(async () => {
    presenceService = {
      isOnline: jest.fn(),
    } as any;

    getUserByIdUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresenceController],
      providers: [
        { provide: PresenceService, useValue: presenceService },
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCase },
      ],
    }).compile();

    controller = module.get<PresenceController>(PresenceController);
  });

  it('should return online: true when user is online', async () => {
    getUserByIdUseCase.execute.mockResolvedValue(createMockUserDto());
    presenceService.isOnline.mockResolvedValue(true);

    const result = await controller.isUserOnline('user-id');

    expect(getUserByIdUseCase.execute).toHaveBeenCalledWith('user-id');
    expect(presenceService.isOnline).toHaveBeenCalledWith('user-id');
    expect(result).toEqual({ online: true });
  });

  it('should return online: false when user is offline', async () => {
    getUserByIdUseCase.execute.mockResolvedValue(createMockUserDto());
    presenceService.isOnline.mockResolvedValue(false);

    const result = await controller.isUserOnline('user-id');

    expect(result).toEqual({ online: false });
  });

  it('should throw if user does not exist', async () => {
    getUserByIdUseCase.execute.mockRejectedValue(new Error('User not found'));

    await expect(controller.isUserOnline('bad-id')).rejects.toThrow(
      'User not found',
    );
  });
});
