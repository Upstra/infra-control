import { AlertSummaryPublisher } from '../alert-summary.publisher';
import { AlertEvents } from '../../../domain/events/alert.events';

describe('AlertSummaryPublisher', () => {
  const summary = {
    open: { critical: 2, warning: 1, info: 0 },
    unacknowledgedCritical: 1,
  };
  const getSummary = { execute: jest.fn() };
  const emitter = { emit: jest.fn() };
  const redis = { safeSet: jest.fn() };
  const publisher = new AlertSummaryPublisher(
    getSummary as any,
    emitter as any,
    redis as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('publishes the summary at startup and after each transition', async () => {
    getSummary.execute.mockResolvedValue(summary);

    await publisher.onApplicationBootstrap();
    await publisher.publish();

    expect(emitter.emit).toHaveBeenCalledTimes(2);
    expect(emitter.emit).toHaveBeenCalledWith(
      AlertEvents.SUMMARY_CHANGED,
      summary,
    );
    expect(redis.safeSet).toHaveBeenCalledWith(
      'alerts:summary',
      JSON.stringify(summary),
    );
  });

  it('stays silent when the database is unavailable', async () => {
    getSummary.execute.mockRejectedValue(new Error('db down'));

    await publisher.publish();

    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
