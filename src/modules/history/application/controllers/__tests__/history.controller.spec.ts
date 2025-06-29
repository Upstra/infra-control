import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { GetHistoryListUseCase } from '../../use-cases/get-history-list.use-case';
import { RoleGuard } from '@/core/guards/role.guard';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { GetUserWithRoleUseCase } from '@/modules/users/application/use-cases/get-user-with-role.use-case';

describe('HistoryController', () => {
  let controller: HistoryController;
  let getList: jest.Mocked<GetHistoryListUseCase>;

  beforeEach(async () => {
    getList = { execute: jest.fn() } as any;

    const mockRoleGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockGetUserWithRoleUseCase = { execute: jest.fn() };
    const mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        { provide: GetHistoryListUseCase, useValue: getList },
        { provide: GetUserWithRoleUseCase, useValue: mockGetUserWithRoleUseCase },
        { provide: Reflector, useValue: mockReflector },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(HistoryController);
  });

  it('returns paginated history', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory('2', '5', 'CREATE');
    expect(getList.execute).toHaveBeenCalledWith(2, 5, {
      action: 'CREATE',
      entity: undefined,
      userId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result).toBe(mock);
  });

  it('uses defaults', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory();
    expect(getList.execute).toHaveBeenCalledWith(1, 10, {
      action: undefined,
      entity: undefined,
      userId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result).toBe(mock);
  });
});
