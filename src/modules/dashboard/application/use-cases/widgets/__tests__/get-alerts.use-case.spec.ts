import { GetAlertsUseCase } from '../get-alerts.use-case';
import { createMockAlert } from '@/modules/alerts/__mocks__/alert.mock';
import { AlertSeverity } from '@/modules/alerts/domain/types/alert.types';

describe('GetAlertsUseCase', () => {
  const listOpen = { execute: jest.fn() };
  const summary = { execute: jest.fn() };
  const useCase = new GetAlertsUseCase(listOpen as any, summary as any);

  beforeEach(() => {
    jest.clearAllMocks();
    summary.execute.mockResolvedValue({
      open: { critical: 1, warning: 1, info: 0 },
      unacknowledgedCritical: 1,
    });
  });

  it('maps open alerts from the alerts module to the widget DTO', async () => {
    listOpen.execute.mockResolvedValue([
      createMockAlert({ acknowledgedAt: new Date(), resourceName: 'UPS-B2' }),
    ]);

    const result = await useCase.execute({});

    expect(result.alerts[0]).toMatchObject({
      severity: 'critical',
      acknowledged: true,
      resource: { type: 'ups', name: 'UPS-B2' },
    });
    expect(result.summary).toEqual({ critical: 1, warning: 1, info: 0 });
  });

  it('filters by severity', async () => {
    listOpen.execute.mockResolvedValue([
      createMockAlert(),
      createMockAlert({ id: 'w', severity: AlertSeverity.WARNING }),
    ]);

    const result = await useCase.execute({ severity: 'warning' } as any);

    expect(result.alerts.map((alert) => alert.id)).toEqual(['w']);
  });
});
