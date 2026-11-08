import { GetHealthStatusUseCase } from '../get-health-status.use-case';
import { HealthCheckResult } from '../../../domain/interfaces/health-check.interface';

const NAMES = [
  'database',
  'redis',
  'system',
  'python',
  'vcenter',
  'ups',
  'prometheus',
] as const;

type Name = (typeof NAMES)[number];

const check = (
  name: Name,
  status: HealthCheckResult['status'] = 'up',
): HealthCheckResult => ({ name, status, message: status, responseTime: 3 });

const build = (overrides: Partial<Record<Name, () => Promise<any>>> = {}) => {
  const services = NAMES.map((name) => ({
    checkHealth: jest.fn(overrides[name] ?? (async () => check(name))),
  }));
  const useCase = new (GetHealthStatusUseCase as any)(
    ...services,
  ) as GetHealthStatusUseCase;
  return { useCase, services };
};

describe('GetHealthStatusUseCase', () => {
  it('reports every component, GitHub no longer among them', async () => {
    const { useCase } = build();
    const result = await useCase.execute();

    expect(result.checks.map((c) => c.name)).toEqual([...NAMES]);
    expect(result.status).toBe('up');
    expect(result.summary).toEqual({ total: 7, up: 7, down: 0, unknown: 0 });
  });

  it('is down when a critical service (database, redis) is down', async () => {
    const { useCase } = build({
      database: async () => check('database', 'down'),
    });
    expect((await useCase.execute()).status).toBe('down');
  });

  it('is only degraded when a non critical component is down', async () => {
    const { useCase } = build({
      vcenter: async () => check('vcenter', 'down'),
      prometheus: async () => check('prometheus', 'down'),
    });
    const result = await useCase.execute();
    expect(result.status).toBe('degraded');
    expect(result.summary.down).toBe(2);
  });

  it('is degraded when a component is unknown (e.g. no UPS configured)', async () => {
    const { useCase } = build({ ups: async () => check('ups', 'unknown') });
    expect((await useCase.execute()).status).toBe('degraded');
  });

  it('turns a throwing check into a down entry with its own name', async () => {
    const { useCase } = build({
      python: async () => {
        throw new Error('spawn EACCES');
      },
    });
    const result = await useCase.execute();
    const python = result.checks.find((c) => c.name === 'python');
    expect(python).toMatchObject({ status: 'down' });
    expect(python?.message).toContain('spawn EACCES');
    expect(result.status).toBe('degraded');
  });
});
