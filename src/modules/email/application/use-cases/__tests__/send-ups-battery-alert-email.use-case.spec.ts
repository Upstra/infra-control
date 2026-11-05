import { SendUpsBatteryAlertEmailUseCase } from '../send-ups-battery-alert-email.use-case';

describe('SendUpsBatteryAlertEmailUseCase', () => {
  const mail = { send: jest.fn() };
  const users = { findAll: jest.fn() };
  const useCase = new SendUpsBatteryAlertEmailUseCase(
    mail as any,
    { get: () => 'https://upstra.lan' } as any,
    users as any,
  );
  const admin = {
    isActive: true,
    email: 'admin@upstra.lan',
    roles: [{ isAdmin: true }],
  };

  beforeEach(() => jest.clearAllMocks());

  it('mails active admins with the remaining minutes in the subject', async () => {
    users.findAll.mockResolvedValue([
      admin,
      { ...admin, email: 'off@upstra.lan', isActive: false },
      { isActive: true, email: 'u@upstra.lan', roles: [] },
    ]);

    await useCase.execute({
      upsName: 'UPS-B2',
      upsIp: '10.0.0.1',
      minutesRemaining: 4,
      alertLevel: 'critical',
      statusLabel: 'Sur batterie',
    });

    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send.mock.calls[0][0].subject).toBe(
      '[CRITICAL] UPS UPS-B2 - 4 minutes restantes',
    );
    expect(mail.send.mock.calls[0][0].context).toMatchObject({
      actionRequired: true,
      dashboardUrl: 'https://upstra.lan/ups',
    });
  });

  it('uses the status label when the runtime is unknown and skips when there is no admin', async () => {
    users.findAll.mockResolvedValueOnce([admin]).mockResolvedValueOnce([]);

    await useCase.execute({
      upsName: 'UPS-B2',
      upsIp: 'ip',
      minutesRemaining: null,
      alertLevel: 'warning',
      statusLabel: 'Sur batterie',
    });
    await useCase.execute({
      upsName: 'UPS-B2',
      upsIp: 'ip',
      minutesRemaining: 3,
      alertLevel: 'critical',
      statusLabel: 'x',
    });

    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send.mock.calls[0][0].subject).toBe(
      '[WARNING] UPS UPS-B2 - Sur batterie',
    );
  });
});
