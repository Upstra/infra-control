import { GetUpsStatusUseCase } from '../get-ups-status.use-case';
import { createMockUps } from '../../../../../ups/__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../../../ups/__mocks__/ups-telemetry.mock';

describe('GetUpsStatusUseCase', () => {
  const upsRepository = { findAll: jest.fn() };
  const cache = { getMultiple: jest.fn() };
  const useCase = new GetUpsStatusUseCase(upsRepository as any, cache as any);

  beforeEach(() => jest.clearAllMocks());

  it('reports onBattery from the real mains status even with 60 minutes left', async () => {
    const base = createMockUpsTelemetry();
    const telemetry = createMockUpsTelemetry({
      status: { ...base.status, onBattery: true, raw: 'OB' },
      battery: { ...base.battery, chargePercent: 90, runtimeSeconds: 3600 },
      load: { ...base.load, percent: 61 },
    });
    upsRepository.findAll.mockResolvedValue([createMockUps({ id: 'ups-1' })]);
    cache.getMultiple.mockResolvedValue({
      'ups-1': createMockBatteryStatus({
        telemetry,
        onBattery: true,
        minutesRemaining: 60,
      }),
    });

    const result = await useCase.execute();

    expect(result.ups[0]).toMatchObject({
      status: 'onBattery',
      batteryLevel: 90,
      load: 61,
      runtime: 60,
    });
    expect(result.summary.onBattery).toBe(1);
    expect(result.summary.averageLoad).toBe(61);
  });

  it('never invents a battery percentage when the charge is unknown', async () => {
    upsRepository.findAll.mockResolvedValue([createMockUps({ id: 'ups-1' })]);
    cache.getMultiple.mockResolvedValue({
      'ups-1': createMockBatteryStatus({
        minutesRemaining: 25,
        alertLevel: 'low',
      }),
    });

    const result = await useCase.execute();

    expect(result.ups[0].batteryLevel).toBeNull();
    expect(result.ups[0].status).toBe('online');
    expect(result.summary.averageLoad).toBeNull();
  });

  it('marks a UPS without cache as unavailable', async () => {
    upsRepository.findAll.mockResolvedValue([createMockUps({ id: 'ups-2' })]);
    cache.getMultiple.mockResolvedValue({});

    const result = await useCase.execute();

    expect(result.ups[0].status).toBe('unavailable');
    expect(result.summary).toMatchObject({ total: 1, unavailable: 1 });
  });
});
