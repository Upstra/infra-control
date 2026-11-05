import { IloHealthCacheService } from '../ilo-health-cache.service';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('IloHealthCacheService', () => {
  const store = new Map<string, string>();
  const redis = {
    safeSetEx: jest.fn(
      async (key: string, _ttl: number, value: string) =>
        void store.set(key, value),
    ),
    safeGet: jest.fn(async (key: string) => store.get(key) ?? null),
    safeMGet: jest.fn(async (keys: string[]) =>
      keys.map((key) => store.get(key) ?? null),
    ),
    safeIncr: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(null),
    safeDel: jest.fn(),
  };
  const cache = new IloHealthCacheService(redis as any);

  it('stores the health with its TTL and reads one or many servers', async () => {
    await cache.set('s1', createIloHealth({ inletC: 31 }), 360);

    expect(redis.safeSetEx).toHaveBeenCalledWith(
      'ilo:health:s1',
      360,
      expect.any(String),
    );
    expect((await cache.get('s1'))?.thermal.inletC).toBe(31);
    expect(Object.keys(await cache.getMany(['s1', 's2']))).toEqual(['s1']);
    expect(await cache.getMany([])).toEqual({});
  });

  it('counts failures, survives Redis outages and corrupted values', async () => {
    store.set('ilo:health:bad', 'nope');

    expect(await cache.recordFailure('s1')).toBe(3);
    expect(await cache.recordFailure('s1')).toBe(0);
    await cache.resetFailures('s1');
    expect(redis.safeDel).toHaveBeenCalledWith('ilo:health:failures:s1');
    expect(await cache.get('bad')).toBeNull();
  });
});
