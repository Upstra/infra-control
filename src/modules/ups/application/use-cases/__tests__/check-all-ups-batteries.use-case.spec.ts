import { CheckAllUpsBatteriesUseCase } from '../check-all-ups-batteries.use-case';
import { createMockUps } from '../../../__mocks__/ups.mock';
import { createMockBatteryStatus } from '../../../__mocks__/ups-telemetry.mock';

describe('CheckAllUpsBatteriesUseCase', () => {
  const repository = { findAll: jest.fn() };
  const getUpsBattery = { execute: jest.fn() };
  const useCase = new CheckAllUpsBatteriesUseCase(
    repository as any,
    getUpsBattery as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('forces a fresh read and counts UPS on battery', async () => {
    repository.findAll.mockResolvedValue([
      createMockUps({ id: 'a' }),
      createMockUps({ id: 'b' }),
    ]);
    getUpsBattery.execute
      .mockResolvedValueOnce(createMockBatteryStatus({ onBattery: true }))
      .mockResolvedValueOnce(createMockBatteryStatus({ onBattery: false }));

    const result = await useCase.execute();

    expect(result).toEqual({ checked: 2, failed: 0, onBattery: 1 });
    expect(getUpsBattery.execute).toHaveBeenCalledWith('a', {
      forceRefresh: true,
    });
  });

  it('keeps going when one UPS fails', async () => {
    repository.findAll.mockResolvedValue([createMockUps({ id: 'a' })]);
    getUpsBattery.execute.mockRejectedValue(new Error('timeout'));

    const result = await useCase.execute();

    expect(result).toEqual({ checked: 0, failed: 1, onBattery: 0 });
  });
});
