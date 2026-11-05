import { PresenceController } from '../presence.controller';
import { PresenceDomainService } from '../../../domain/services/presence.domain.service';

describe('PresenceController', () => {
  const presence = { isOnline: jest.fn(), listOnline: jest.fn() };
  const getUser = { execute: jest.fn() };
  const controller = new PresenceController(
    presence as any,
    getUser as any,
    new PresenceDomainService(),
  );
  const record = {
    route: '/ups',
    title: 'Onduleurs',
    lastActivityAt: new Date().toISOString(),
    connectedAt: null,
  };

  beforeEach(() => jest.clearAllMocks());

  it('lists online users with their page for an active viewer', async () => {
    presence.listOnline.mockResolvedValue([{ userId: 'zoe', record }]);

    const result = await controller.listOnline({
      userId: 'jbidule',
      isActive: true,
    } as any);

    expect(result).toEqual([
      {
        userId: 'zoe',
        online: true,
        status: 'active',
        route: '/ups',
        title: 'Onduleurs',
        lastActivityAt: record.lastActivityAt,
      },
    ]);
  });

  it('masks the page for an inactive viewer', async () => {
    presence.listOnline.mockResolvedValue([{ userId: 'zoe', record }]);

    const [view] = await controller.listOnline({
      userId: 'x',
      isActive: false,
    } as any);

    expect(view).toMatchObject({ online: true, route: null, title: null });
  });

  it('checks that the user exists before answering online status', async () => {
    getUser.execute.mockRejectedValue(new Error('User not found'));

    await expect(controller.isUserOnline('missing')).rejects.toThrow(
      'User not found',
    );
    expect(presence.isOnline).not.toHaveBeenCalled();
  });
});
