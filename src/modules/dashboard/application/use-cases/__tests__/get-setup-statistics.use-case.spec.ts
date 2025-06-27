import { GetSetupStatisticsUseCase } from '../get-setup-statistics.use-case';

describe('GetSetupStatisticsUseCase', () => {
  it('delegates to StatisticsPort', async () => {
    const port = {
      getStatistics: jest.fn().mockResolvedValue({ totalUsers: 1 }),
    } as any;
    const useCase = new GetSetupStatisticsUseCase(port);

    const result = await useCase.execute();

    expect(port.getStatistics).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalUsers: 1 });
  });
});
