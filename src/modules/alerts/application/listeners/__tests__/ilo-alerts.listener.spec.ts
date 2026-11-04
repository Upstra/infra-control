import { IloAlertsListener } from '../ilo-alerts.listener';
import { AlertSeverity, AlertType } from '../../../domain/types/alert.types';
import { IloHealthDomainService } from '@/modules/ilos/domain/services/ilo-health.domain.service';
import { createIloHealth } from '@/modules/ilos/__mocks__/ilo-health.mock';

describe('IloAlertsListener', () => {
  const alertService = {
    raise: jest.fn().mockResolvedValue({}),
    resolve: jest.fn(),
  };
  const listener = new IloAlertsListener(
    alertService as any,
    new IloHealthDomainService(),
  );
  const checked = (
    health = createIloHealth(),
    room = { inletWarnC: 30, inletCritC: 35 },
  ) => ({
    serverId: 'srv-1',
    serverName: 'srv-b2-03',
    roomId: 'room-b',
    room,
    health,
  });
  const raisedTypes = () =>
    alertService.raise.mock.calls.map(([input]) => input.type);
  const resolvedKeys = () =>
    alertService.resolve.mock.calls.map(([key]) => key);

  beforeEach(() => jest.clearAllMocks());

  it('raises the inlet alert above the room threshold and keeps it open inside the hysteresis band', async () => {
    await listener.handleChecked(checked(createIloHealth({ inletC: 36 })));
    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AlertType.SERVER_INLET_TEMPERATURE_HIGH,
        severity: AlertSeverity.CRITICAL,
      }),
    );

    jest.clearAllMocks();
    await listener.handleChecked(checked(createIloHealth({ inletC: 29.5 })));
    expect(resolvedKeys()).not.toContain(
      'server:srv-1:server_inlet_temperature_high',
    );

    await listener.handleChecked(checked(createIloHealth({ inletC: 28 })));
    expect(resolvedKeys()).toContain(
      'server:srv-1:server_inlet_temperature_high',
    );
  });

  it('raises PSU and system health alerts for the mockup scenario', async () => {
    const health = createIloHealth({
      inletC: 31,
      health: 'Warning',
      supplies: [
        {
          name: 'PSU 1',
          state: 'Enabled',
          health: 'OK',
          capacityW: 800,
          outputW: 412,
        },
        {
          name: 'PSU 2',
          state: 'Absent',
          health: null,
          capacityW: null,
          outputW: null,
        },
      ],
    });

    await listener.handleChecked(
      checked(health, { inletWarnC: null, inletCritC: null } as any),
    );

    expect(raisedTypes()).toEqual([
      AlertType.SERVER_PSU_DEGRADED,
      AlertType.SERVER_HEALTH_DEGRADED,
    ]);
    expect(alertService.raise.mock.calls[0][0].message).toContain(
      'PSU 2 absente',
    );
  });

  it('opens an info alert when the iLO stops answering', async () => {
    await listener.handleUnreachable({
      serverId: 'srv-1',
      serverName: 'srv-b2-03',
      iloIp: 'mock-ilo-3',
      failures: 3,
      error: 'timeout',
    });

    expect(alertService.raise).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AlertType.SERVER_ILO_UNREACHABLE,
        severity: AlertSeverity.INFO,
      }),
    );
  });
});
