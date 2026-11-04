import { SchedulerRegistry } from '@nestjs/schedule';
import { IloHealthScheduler } from '../ilo-health.scheduler';

describe('IloHealthScheduler', () => {
  const collect = { execute: jest.fn(), intervalSeconds: jest.fn(() => 120) };
  const servers = { findAllWithCredentials: jest.fn() };
  const redis = {
    safeSetNxEx: jest.fn().mockResolvedValue(true),
    safeReleaseLock: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'ILO_HEALTH_CONCURRENCY' ? '2' : undefined,
    ),
  };
  const scheduler = new IloHealthScheduler(
    collect as any,
    servers as any,
    redis as any,
    new SchedulerRegistry(),
    config as any,
  );
  const server = (id: string, ilo = true) => ({
    id,
    name: id,
    ilo: ilo ? { ip: `ilo-${id}` } : undefined,
  });

  beforeEach(() => jest.clearAllMocks());

  it('never runs more scripts at once than ILO_HEALTH_CONCURRENCY', async () => {
    let running = 0;
    let peak = 0;
    collect.execute.mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
    });
    servers.findAllWithCredentials.mockResolvedValue(
      ['a', 'b', 'c', 'd', 'e'].map((id) => server(id)),
    );

    const result = await scheduler.run();

    expect(peak).toBe(2);
    expect(result).toEqual({ checked: 5, failed: 0 });
  });

  it('skips servers without iLO and counts failures', async () => {
    servers.findAllWithCredentials.mockResolvedValue([
      server('a'),
      server('b', false),
      server('c'),
    ]);
    collect.execute
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('timeout'));

    const result = await scheduler.run();

    expect(collect.execute).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ checked: 1, failed: 1 });
  });

  it('does nothing while another run holds the lock', async () => {
    redis.safeSetNxEx.mockResolvedValueOnce(false);

    await expect(scheduler.run()).resolves.toBeNull();
    expect(servers.findAllWithCredentials).not.toHaveBeenCalled();
  });
});
