import { BadRequestException } from '@nestjs/common';
import { GetUpsBatteryUseCase } from '../get-ups-battery.use-case';
import { UpsBatteryDomainService } from '../../../domain/services/ups-battery.domain.service';
import { UpsBatteryEvents } from '../../../domain/events/ups-battery.events';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';
import { createMockUps } from '../../../__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../__mocks__/ups-telemetry.mock';

describe('GetUpsBatteryUseCase edge cases', () => {
  const python = { executePython: jest.fn() };
  const emitter = { emit: jest.fn() };
  const repository = { findUpsById: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn() };
  const useCase = new GetUpsBatteryUseCase(
    python as any,
    emitter as any,
    repository as any,
    new UpsBatteryDomainService(),
    cache as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('serves the cache without calling the script and fails on an unknown UPS', async () => {
    const cached = createMockBatteryStatus();
    cache.get.mockResolvedValueOnce(cached).mockResolvedValueOnce(null);
    repository.findUpsById.mockResolvedValue(null);

    await expect(useCase.execute('ups-1')).resolves.toBe(cached);
    await expect(useCase.execute('ghost')).rejects.toBeInstanceOf(
      UpsNotFoundException,
    );
    expect(python.executePython).not.toHaveBeenCalled();
  });

  it('turns a script crash into a 400 and announces the failure', async () => {
    cache.get.mockResolvedValue(null);
    repository.findUpsById.mockResolvedValue(createMockUps());
    python.executePython.mockRejectedValue({});

    await expect(useCase.execute('ups-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(emitter.emit).toHaveBeenCalledWith(
      UpsBatteryEvents.CHECK_FAILED,
      expect.objectContaining({ error: 'Failed to get battery status' }),
    );
  });

  it('emits a battery alert when the level worsens but not for a normal UPS on mains', async () => {
    cache.get.mockResolvedValue(
      createMockBatteryStatus({ alertLevel: 'low', onBattery: true }),
    );
    repository.findUpsById.mockResolvedValue(createMockUps());
    const base = createMockUpsTelemetry();
    python.executePython
      .mockResolvedValueOnce(
        createMockUpsTelemetry({
          status: { ...base.status, onBattery: true, lowBattery: true },
        }),
      )
      .mockResolvedValueOnce(base);

    await useCase.execute('ups-1', { forceRefresh: true });
    await useCase.execute('ups-1', { forceRefresh: true });

    const names = emitter.emit.mock.calls.map(([name]) => name);
    expect(
      names.filter((name) => name === UpsBatteryEvents.BATTERY_ALERT),
    ).toHaveLength(1);
    expect(
      names.filter((name) => name === UpsBatteryEvents.STATUS_CHANGED),
    ).toHaveLength(1);
  });
});
