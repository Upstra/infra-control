import { GetUpsListUseCase } from '../get-ups-list.use-case';
import { UpsListResponseDto } from '../../dto';
import { createMockUps } from '../../../__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../__mocks__/ups-telemetry.mock';

describe('GetUpsListUseCase', () => {
  const repo = { paginateWithServerCount: jest.fn() };
  const cache = { getMultiple: jest.fn() };
  const useCase = new GetUpsListUseCase(repo as any, cache as any);

  beforeEach(() => jest.clearAllMocks());

  it('includes the cached telemetry in each battery status', async () => {
    const telemetry = createMockUpsTelemetry();
    repo.paginateWithServerCount.mockResolvedValue([
      [{ ups: createMockUps({ id: 'ups-1' }), serverCount: 2 }],
      1,
    ]);
    cache.getMultiple.mockResolvedValue({
      'ups-1': createMockBatteryStatus({ telemetry, onBattery: false }),
    });

    const result = await useCase.execute(1, 10);

    expect(result).toBeInstanceOf(UpsListResponseDto);
    expect(result.items[0].batteryStatus?.telemetry).toEqual(telemetry);
    expect(result.items[0].batteryStatus?.onBattery).toBe(false);
  });

  it('leaves the battery status undefined without cache', async () => {
    repo.paginateWithServerCount.mockResolvedValue([
      [{ ups: createMockUps({ id: 'ups-2' }), serverCount: 0 }],
      1,
    ]);
    cache.getMultiple.mockResolvedValue({ 'ups-2': null });

    const result = await useCase.execute();

    expect(result.items[0].batteryStatus).toBeUndefined();
    expect(repo.paginateWithServerCount).toHaveBeenCalledWith(1, 10);
  });
});
