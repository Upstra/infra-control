import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../dashboard.controller';
import { GetDashboardFullStatsUseCase } from '../../use-cases';

describe('DashboardController', () => {
  let controller: DashboardController;
  const getStats = { execute: jest.fn() } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: GetDashboardFullStatsUseCase, useValue: getStats }],
    }).compile();

    controller = module.get(DashboardController);
  });

  it('returns dashboard stats', async () => {
    getStats.execute.mockResolvedValue({ totalUsers: 1 });
    const result = await controller.getFullDashboard();
    expect(getStats.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalUsers: 1 });
  });
});
