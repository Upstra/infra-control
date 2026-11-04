import { AlertsGateway } from '../alerts.gateway';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import { AlertTransitionType } from '../../../domain/types/alert.types';

describe('AlertsGateway', () => {
  const summary = {
    open: { critical: 1, warning: 0, info: 0 },
    unacknowledgedCritical: 1,
  };
  const getSummary = { execute: jest.fn().mockResolvedValue(summary) };
  const gateway = new AlertsGateway(getSummary as any);
  const server = { emit: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.server = server as any;
  });

  it('pushes alert:opened with the full alert and the summary', async () => {
    await gateway.handleTransition({
      alert: createMockAlert(),
      transition: createMockTransition(),
    });

    expect(server.emit).toHaveBeenCalledWith(
      'alert:opened',
      expect.objectContaining({ id: 'alert-1' }),
    );
    expect(server.emit).toHaveBeenCalledWith('alerts:summary', summary);
  });

  it('maps resolutions to alert:resolved', async () => {
    await gateway.handleTransition({
      alert: createMockAlert(),
      transition: createMockTransition({ type: AlertTransitionType.RESOLVED }),
    });

    expect(server.emit).toHaveBeenCalledWith(
      'alert:resolved',
      expect.anything(),
    );
  });
});
