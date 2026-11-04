import { Logger } from '@nestjs/common';
import { RedisSafeService } from '../redis-safe.service';

describe('RedisSafeService locks and counters', () => {
  const pipeline = { set: jest.fn(), exec: jest.fn().mockResolvedValue([]) };
  const client = {
    incr: jest.fn(),
    expire: jest.fn(),
    set: jest.fn(),
    eval: jest.fn(),
    pipeline: jest.fn(() => pipeline),
  };
  let service: RedisSafeService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    service = new RedisSafeService({ getOrNil: () => client } as any);
  });

  it('acquires a lock only when SET NX succeeds', async () => {
    client.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

    await expect(service.safeSetNxEx('lock', 30, 'a')).resolves.toBe(true);
    await expect(service.safeSetNxEx('lock', 30, 'b')).resolves.toBe(false);
    expect(client.set).toHaveBeenCalledWith('lock', 'a', 'EX', 30, 'NX');
  });

  it('increments a counter with a TTL and releases a lock it owns', async () => {
    client.incr.mockResolvedValue(3);
    client.eval.mockResolvedValue(1);

    await expect(service.safeIncr('counter', 60)).resolves.toBe(3);
    expect(client.expire).toHaveBeenCalledWith('counter', 60);
    await expect(service.safeReleaseLock('lock', 'a')).resolves.toBe(true);
  });

  it('writes many keys through one pipeline', async () => {
    await service.safeMSetEx(
      [
        ['k1', 'v1'],
        ['k2', 'v2'],
      ],
      90,
    );

    expect(client.pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline.set).toHaveBeenCalledWith('k2', 'v2', 'EX', 90);
    expect(pipeline.exec).toHaveBeenCalled();
  });
});
