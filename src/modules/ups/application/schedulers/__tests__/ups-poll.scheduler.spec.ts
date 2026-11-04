import { SchedulerRegistry } from '@nestjs/schedule';
import {
  UPS_POLL_CRON_JOB,
  UPS_POLL_ON_BATTERY_INTERVAL,
  UpsPollScheduler,
} from '../ups-poll.scheduler';

describe('UpsPollScheduler', () => {
  const checkAll = { execute: jest.fn() };
  const config = { get: jest.fn() };
  let registry: SchedulerRegistry;
  let scheduler: UpsPollScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new SchedulerRegistry();
    scheduler = new UpsPollScheduler(checkAll as any, registry, config as any);
  });

  afterEach(() => scheduler.onModuleDestroy());

  it('registers the cron from UPS_POLL_CRON', () => {
    config.get.mockImplementation((key: string) =>
      key === 'UPS_POLL_CRON' ? '*/5 * * * *' : undefined,
    );

    scheduler.onApplicationBootstrap();

    expect(registry.doesExist('cron', UPS_POLL_CRON_JOB)).toBe(true);
  });

  it('switches to fast polling while a UPS is on battery and back on mains', async () => {
    checkAll.execute.mockResolvedValueOnce({
      checked: 1,
      failed: 0,
      onBattery: 1,
    });
    await scheduler.poll();
    expect(registry.doesExist('interval', UPS_POLL_ON_BATTERY_INTERVAL)).toBe(
      true,
    );

    checkAll.execute.mockResolvedValueOnce({
      checked: 1,
      failed: 0,
      onBattery: 0,
    });
    await scheduler.poll();
    expect(scheduler.isFastPolling()).toBe(false);
  });
});
