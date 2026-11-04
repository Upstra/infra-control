import { ListAlertsUseCase } from '../list-alerts.use-case';
import { GetAlertSummaryUseCase } from '../get-alert-summary.use-case';
import { GetAlertByIdUseCase } from '../get-alert-by-id.use-case';
import { AlertNotFoundException } from '../../../domain/exceptions/alert.exceptions';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import { AlertStatus } from '../../../domain/types/alert.types';

describe('Alert query use cases', () => {
  const repository = {
    paginate: jest.fn(),
    countOpen: jest.fn(),
    findByIdWithTransitions: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('lists alerts with the requested filters and pagination', async () => {
    repository.paginate.mockResolvedValue([[createMockAlert()], 41]);

    const result = await new ListAlertsUseCase(repository as any).execute({
      status: AlertStatus.OPEN,
      page: 2,
      limit: 20,
    });

    expect(repository.paginate).toHaveBeenCalledWith(
      expect.objectContaining({ status: AlertStatus.OPEN, page: 2, limit: 20 }),
    );
    expect(result).toMatchObject({
      totalItems: 41,
      totalPages: 3,
      currentPage: 2,
    });
  });

  it('shapes the summary for the bell', async () => {
    repository.countOpen.mockResolvedValue({
      critical: 2,
      warning: 1,
      info: 0,
      unacknowledgedCritical: 1,
    });

    await expect(
      new GetAlertSummaryUseCase(repository as any).execute(),
    ).resolves.toEqual({
      open: { critical: 2, warning: 1, info: 0 },
      unacknowledgedCritical: 1,
    });
  });

  it('returns the alert with its transitions or a 404', async () => {
    repository.findByIdWithTransitions
      .mockResolvedValueOnce(
        createMockAlert({ transitions: [createMockTransition()] }),
      )
      .mockResolvedValueOnce(null);
    const useCase = new GetAlertByIdUseCase(repository as any);

    const alert = await useCase.execute('alert-1');
    expect(alert.transitions).toHaveLength(1);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      AlertNotFoundException,
    );
  });
});
