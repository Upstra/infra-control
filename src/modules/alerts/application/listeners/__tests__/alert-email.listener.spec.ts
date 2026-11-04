import { AlertEmailListener } from '../alert-email.listener';
import {
  createMockAlert,
  createMockTransition,
} from '../../../__mocks__/alert.mock';
import {
  AlertSeverity,
  AlertTransitionType,
} from '../../../domain/types/alert.types';
import { EmailEvents } from '@/modules/email/domain/events/email.events';

describe('AlertEmailListener', () => {
  const eventEmitter = { emit: jest.fn() };
  const listener = new AlertEmailListener(eventEmitter as any);

  beforeEach(() => jest.clearAllMocks());

  it('mails admins when a critical UPS alert opens', () => {
    const alert = createMockAlert({
      details: { latest: { ip: '10.0.0.1', minutesRemaining: 4 } },
    });

    listener.handleTransition({ alert, transition: createMockTransition() });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      EmailEvents.UPS_BATTERY_CRITICAL,
      expect.objectContaining({
        upsName: 'UPS-B2',
        upsIp: '10.0.0.1',
        minutesRemaining: 4,
      }),
    );
  });

  it('stays silent for repeated confirmations, acknowledgements and warnings', () => {
    listener.handleTransition({
      alert: createMockAlert(),
      transition: createMockTransition({
        type: AlertTransitionType.ACKNOWLEDGED,
      }),
    });
    listener.handleTransition({
      alert: createMockAlert({ severity: AlertSeverity.WARNING }),
      transition: createMockTransition(),
    });

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
