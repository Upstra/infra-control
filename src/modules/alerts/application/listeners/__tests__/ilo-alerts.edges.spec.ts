import { IloAlertsListener } from '../ilo-alerts.listener';
import { AlertSeverity, AlertType } from '../../../domain/types/alert.types';
import { IloHealthDomainService } from '@/modules/ilos/domain/services/ilo-health.domain.service';
import { createIloHealth } from '@/modules/ilos/__mocks__/ilo-health.mock';

describe('IloAlertsListener edge cases', () => {
  const alertService = {
    raise: jest.fn().mockResolvedValue({}),
    resolve: jest.fn(),
  };
  const listener = new IloAlertsListener(
    alertService as any,
    new IloHealthDomainService(),
  );
  const checked = (health: ReturnType<typeof createIloHealth>) => ({
    serverId: 's',
    serverName: 'srv',
    roomId: null,
    room: null,
    health,
  });

  beforeEach(() => jest.clearAllMocks());

  it('raises a warning inlet alert and a critical hardware health alert', async () => {
    await listener.handleChecked(
      checked(createIloHealth({ inletC: 43, health: 'Critical' })),
    );

    expect(
      alertService.raise.mock.calls.map(([input]) => [
        input.type,
        input.severity,
      ]),
    ).toEqual([
      [AlertType.SERVER_INLET_TEMPERATURE_HIGH, AlertSeverity.WARNING],
      [AlertType.SERVER_HEALTH_DEGRADED, AlertSeverity.CRITICAL],
    ]);
  });

  it('resolves PSU and health alerts on a healthy reading without a system health value', async () => {
    await listener.handleChecked(checked(createIloHealth({ health: null })));

    expect(alertService.raise).not.toHaveBeenCalled();
    expect(alertService.resolve.mock.calls.map(([key]) => key)).toEqual(
      expect.arrayContaining([
        'server:s:server_psu_degraded',
        'server:s:server_health_degraded',
      ]),
    );
  });

  it('swallows store errors', async () => {
    alertService.resolve.mockRejectedValueOnce(new Error('db down'));
    alertService.raise.mockRejectedValueOnce(new Error('db down'));

    await expect(
      listener.handleChecked(checked(createIloHealth())),
    ).resolves.toBeUndefined();
    await expect(
      listener.handleUnreachable({
        serverId: 's',
        serverName: 'srv',
        iloIp: 'i',
        failures: 3,
        error: 'e',
      }),
    ).resolves.toBeUndefined();
  });
});
