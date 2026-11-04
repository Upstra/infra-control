import { SchedulerRegistry } from '@nestjs/schedule';
import { VmwareTelemetryScheduler } from '../vmware-telemetry.scheduler';

describe('VmwareTelemetryScheduler', () => {
  const collectMetrics = {
    execute: jest.fn(),
    intervalSeconds: jest.fn(() => 60),
  };
  const collectEvents = { execute: jest.fn() };
  const redis = { safeSetNxEx: jest.fn(), safeReleaseLock: jest.fn() };
  const config = { get: jest.fn() };
  const scheduler = new VmwareTelemetryScheduler(
    collectMetrics as any,
    collectEvents as any,
    redis as any,
    new SchedulerRegistry(),
    config as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('skips the run when the Redis lock is already held', async () => {
    redis.safeSetNxEx.mockResolvedValue(false);

    await expect(scheduler.runMetrics()).resolves.toBe(false);
    expect(collectMetrics.execute).not.toHaveBeenCalled();
  });

  it('runs once with the lock and always releases it, even on failure', async () => {
    redis.safeSetNxEx.mockResolvedValue(true);
    collectEvents.execute.mockRejectedValue(new Error('vCenter down'));

    await expect(scheduler.runEvents()).resolves.toBe(true);
    expect(redis.safeSetNxEx).toHaveBeenCalledWith(
      'vmware:events:lock',
      120,
      expect.any(String),
    );
    expect(redis.safeReleaseLock).toHaveBeenCalledWith(
      'vmware:events:lock',
      redis.safeSetNxEx.mock.calls[0][2],
    );
  });
});
