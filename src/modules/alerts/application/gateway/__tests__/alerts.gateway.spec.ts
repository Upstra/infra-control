import { AlertsGateway } from '../alerts.gateway';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import { AlertTransitionType } from '../../../domain/types/alert.types';

describe('AlertsGateway', () => {
  const gateway = new AlertsGateway();
  const server = { emit: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.server = server as any;
  });

  it('pushes alert:opened with the full alert', () => {
    gateway.handleTransition({
      alert: createMockAlert(),
      transition: createMockTransition(),
    });

    expect(server.emit).toHaveBeenCalledWith(
      'alert:opened',
      expect.objectContaining({ id: 'alert-1' }),
    );
  });

  it('maps resolutions to alert:resolved and relays the summary', () => {
    const summary = {
      open: { critical: 1, warning: 0, info: 0 },
      unacknowledgedCritical: 1,
    };

    gateway.handleTransition({
      alert: createMockAlert(),
      transition: createMockTransition({ type: AlertTransitionType.RESOLVED }),
    });
    gateway.handleSummary(summary);

    expect(server.emit).toHaveBeenCalledWith(
      'alert:resolved',
      expect.anything(),
    );
    expect(server.emit).toHaveBeenCalledWith('alerts:summary', summary);
  });
});
