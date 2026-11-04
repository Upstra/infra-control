import { BadRequestException } from '@nestjs/common';
import { GetUpsBatteryUseCase } from '../get-ups-battery.use-case';
import { UpsBatteryDomainService } from '../../../domain/services/ups-battery.domain.service';
import { UpsBatteryEvents } from '../../../domain/events/ups-battery.events';
import { createMockUps } from '../../../__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '../../../__mocks__/ups-telemetry.mock';

describe('GetUpsBatteryUseCase', () => {
  const pythonExecutor = { executePython: jest.fn() };
  const eventEmitter = { emit: jest.fn() };
  const repository = { findUpsById: jest.fn() };
  const cache = { get: jest.fn(), set: jest.fn() };
  const useCase = new GetUpsBatteryUseCase(
    pythonExecutor as any,
    eventEmitter as any,
    repository as any,
    new UpsBatteryDomainService(),
    cache as any,
  );
  const ups = createMockUps({ id: 'ups-1', name: 'UPS-B2' });
  const onBatteryTelemetry = () => {
    const base = createMockUpsTelemetry();
    return createMockUpsTelemetry({
      status: { ...base.status, raw: 'OB DISCHRG', onBattery: true },
      battery: { ...base.battery, chargePercent: 80, runtimeSeconds: 3600 },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.findUpsById.mockResolvedValue(ups);
  });

  it('reads JSON telemetry and emits a status change when the UPS goes on battery', async () => {
    cache.get.mockResolvedValue(createMockBatteryStatus({ onBattery: false }));
    pythonExecutor.executePython.mockResolvedValue(onBatteryTelemetry());

    const status = await useCase.execute('ups-1', { forceRefresh: true });

    expect(pythonExecutor.executePython).toHaveBeenCalledWith(
      'ups_battery.sh',
      ['--ip', ups.ip, '--format', 'json'],
    );
    expect(status.onBattery).toBe(true);
    expect(status.alertLevel).toBe('low');
    expect(cache.set).toHaveBeenCalledWith('ups-1', status);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      UpsBatteryEvents.STATUS_CHANGED,
      expect.objectContaining({
        previous: false,
        current: true,
        upsName: 'UPS-B2',
      }),
    );
  });

  it('does not emit an alert again while the alert level is unchanged', async () => {
    const telemetry = onBatteryTelemetry();
    cache.get.mockResolvedValue(
      createMockBatteryStatus({
        onBattery: true,
        alertLevel: 'low',
        telemetry,
      }),
    );
    pythonExecutor.executePython.mockResolvedValue(telemetry);

    await useCase.execute('ups-1', { forceRefresh: true });

    const emitted = eventEmitter.emit.mock.calls.map(([name]) => name);
    expect(emitted).toEqual([UpsBatteryEvents.BATTERY_CHECKED]);
  });

  it('keeps working with the legacy integer output and rejects garbage', async () => {
    cache.get.mockResolvedValue(null);
    pythonExecutor.executePython.mockResolvedValueOnce('12');

    const status = await useCase.execute('ups-1');

    expect(status.telemetry).toBeNull();
    expect(status.minutesRemaining).toBe(12);
    expect(status.alertLevel).toBe('warning');

    pythonExecutor.executePython.mockResolvedValueOnce('oops');
    await expect(useCase.execute('ups-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      UpsBatteryEvents.CHECK_FAILED,
      expect.objectContaining({ upsId: 'ups-1', upsName: 'UPS-B2' }),
    );
  });
});
