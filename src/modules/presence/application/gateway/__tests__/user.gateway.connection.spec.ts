import { UserGateway } from '../user.gateway';
import { PresenceDomainService } from '../../../domain/services/presence.domain.service';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';

describe('UserGateway connection lifecycle', () => {
  const presence = {
    markOnline: jest.fn(),
    markOffline: jest.fn(),
    recordActivity: jest.fn(),
    isOnline: jest.fn(),
  };
  const jwt = { verify: jest.fn() };
  const emit = jest.fn();
  const gateway = new UserGateway(
    presence as any,
    jwt as any,
    new PresenceDomainService(),
  );
  const client = (token?: string) =>
    ({
      handshake: { auth: token ? { token } : {} },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.server = { to: () => ({ emit }) } as any;
  });

  it('asks the client to refresh on a missing or invalid token', async () => {
    const anonymous = client();
    await gateway.handleConnection(anonymous);
    jwt.verify.mockImplementation(() => {
      throw new Error('expired');
    });
    const expired = client('old');
    await gateway.handlePing(expired, {});

    expect(anonymous.emit).toHaveBeenCalledWith('auth:refresh');
    expect(expired.disconnect).toHaveBeenCalled();
    expect(presence.markOnline).not.toHaveBeenCalled();
  });

  it('broadcasts offline on disconnect and answers status requests', async () => {
    jwt.verify.mockReturnValue({ userId: 'u1', isActive: true });
    presence.isOnline.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await gateway.handleDisconnect(client('ok'));

    expect(presence.markOffline).toHaveBeenCalledWith('u1');
    expect(emit).toHaveBeenCalledWith(
      'presence:update',
      expect.objectContaining({ userId: 'u1', online: false }),
    );
    expect(await gateway.handleStatusRequest('u1')).toEqual({
      userId: 'u1',
      online: true,
    });
    expect(await gateway.handleBulkStatusRequest(['u2'])).toEqual({
      u2: false,
    });
  });

  it('rethrows unexpected errors instead of hiding them', async () => {
    jwt.verify.mockReturnValue({ userId: 'u1', isActive: true });
    presence.markOffline.mockRejectedValueOnce(new Error('boom'));

    await expect(gateway.handleDisconnect(client('ok'))).rejects.toThrow(
      'boom',
    );
    expect(new JwtNotValid()).toBeInstanceOf(Error);
  });
});
