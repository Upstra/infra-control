import { GetUpsStatusUseCase } from '../get-ups-status.use-case';
import { createMockUps } from '../../../../../ups/__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../../../ups/__mocks__/ups-telemetry.mock';

describe('GetUpsStatusUseCase edge cases', () => {
  const repository = { findAll: jest.fn() };
  const cache = { getMultiple: jest.fn() };
  const useCase = new GetUpsStatusUseCase(repository as any, cache as any);

  it('returns an empty summary without any UPS', async () => {
    repository.findAll.mockResolvedValue(null);
    cache.getMultiple.mockResolvedValue({});

    await expect(useCase.execute()).resolves.toEqual({
      ups: [],
      summary: {
        total: 0,
        online: 0,
        onBattery: 0,
        offline: 0,
        unavailable: 0,
        averageLoad: null,
        isMocked: false,
      },
    });
  });

  it('reads the last test date and ignores an invalid one', async () => {
    const base = createMockUpsTelemetry();
    repository.findAll.mockResolvedValue([
      createMockUps({ id: 'a' }),
      createMockUps({ id: 'b' }),
    ]);
    cache.getMultiple.mockResolvedValue({
      a: createMockBatteryStatus({
        telemetry: createMockUpsTelemetry({
          battery: { ...base.battery, lastTestAt: '2026-10-01T08:00:00Z' },
        }),
        minutesRemaining: undefined as any,
      }),
      b: createMockBatteryStatus({
        telemetry: createMockUpsTelemetry({
          battery: { ...base.battery, lastTestAt: 'pas une date' },
        }),
      }),
    });

    const { ups, summary } = await useCase.execute();

    expect(ups[0].lastTest).toEqual(new Date('2026-10-01T08:00:00Z'));
    expect(ups[0].runtime).toBeNull();
    expect(ups[1].lastTest).toBeNull();
    expect(summary.averageLoad).toBe(40);
  });
});
