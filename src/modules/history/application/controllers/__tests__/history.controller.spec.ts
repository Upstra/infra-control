import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { GetHistoryListUseCase } from '../../use-cases/get-history-list.use-case';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';

describe('HistoryController', () => {
  let controller: HistoryController;
  let getList: jest.Mocked<GetHistoryListUseCase>;

  beforeEach(async () => {
    getList = { execute: jest.fn() } as any;
    const mockJwtGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockRoleGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [{ provide: GetHistoryListUseCase, useValue: getList }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(HistoryController);
  });

  it('returns paginated history', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory('2', '5');
    expect(getList.execute).toHaveBeenCalledWith(2, 5, {});
    expect(result).toBe(mock);
  });

  it('uses defaults', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory();
    expect(getList.execute).toHaveBeenCalledWith(1, 10, {});
    expect(result).toBe(mock);
  });

  it('passes filters to use case', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    await controller.getHistory(
      '1',
      '10',
      'CREATE',
      'role',
      'user',
      '2024-01-01',
      '2024-01-31',
    );
    expect(getList.execute).toHaveBeenCalledWith(1, 10, {
      action: 'CREATE',
      entity: 'role',
      userId: 'user',
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    });
  });
});
