import { ForbiddenException } from '@nestjs/common';
import { AcknowledgeAlertUseCase } from '../acknowledge-alert.use-case';
import { AlertNotFoundException } from '../../../domain/exceptions/alert.exceptions';
import { createMockAlert } from '../../../__mocks__/alert.mock';

describe('AcknowledgeAlertUseCase', () => {
  const repository = { findById: jest.fn() };
  const alertService = { acknowledge: jest.fn(), unacknowledge: jest.fn() };
  const permissions = { canAct: jest.fn() };
  const useCase = new AcknowledgeAlertUseCase(
    repository as any,
    alertService as any,
    permissions as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('acknowledges when the user may act on the resource', async () => {
    repository.findById.mockResolvedValue(createMockAlert());
    permissions.canAct.mockResolvedValue(true);
    alertService.acknowledge.mockResolvedValue(
      createMockAlert({
        acknowledgedAt: new Date(),
        acknowledgedById: 'user-1',
      }),
    );

    const result = await useCase.execute('alert-1', 'user-1', true);

    expect(result.acknowledged).toBe(true);
    expect(alertService.acknowledge).toHaveBeenCalledWith('alert-1', 'user-1');
  });

  it('refuses users without permission and unknown alerts', async () => {
    repository.findById.mockResolvedValueOnce(createMockAlert());
    permissions.canAct.mockResolvedValue(false);
    await expect(
      useCase.execute('alert-1', 'user-2', false),
    ).rejects.toBeInstanceOf(ForbiddenException);

    repository.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute('missing', 'user-1', true),
    ).rejects.toBeInstanceOf(AlertNotFoundException);
  });
});
