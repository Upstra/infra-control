import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { GetHistoryListUseCase } from '../../use-cases/get-history-list.use-case';

describe('HistoryController', () => {
  let controller: HistoryController;
  let getList: jest.Mocked<GetHistoryListUseCase>;

  beforeEach(async () => {
    getList = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [{ provide: GetHistoryListUseCase, useValue: getList }],
    }).compile();

    controller = module.get(HistoryController);
  });

  it('returns paginated history', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory('2', '5');
    expect(getList.execute).toHaveBeenCalledWith(2, 5);
    expect(result).toBe(mock);
  });

  it('uses defaults', async () => {
    const mock = { items: [] } as any;
    getList.execute.mockResolvedValue(mock);
    const result = await controller.getHistory();
    expect(getList.execute).toHaveBeenCalledWith(1, 10);
    expect(result).toBe(mock);
  });
});
