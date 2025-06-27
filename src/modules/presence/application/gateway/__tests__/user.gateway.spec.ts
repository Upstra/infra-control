import { PresenceService } from '../../services/presence.service';
import { JwtService } from '@nestjs/jwt';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';
import { Socket } from 'socket.io';
import { Handshake } from 'socket.io/dist/socket-types';
import { UserGateway } from '../user.gateway';

describe('UserGateway', () => {
  let gateway: UserGateway;
  let presenceService: jest.Mocked<PresenceService>;
  let jwtService: jest.Mocked<JwtService>;
  let mockServerEmit: jest.Mock;

  const mockSocket = (token?: string): Partial<Socket> => ({
    handshake: {
      auth: { token },
      headers: {},
      time: '',
      address: '',
      xdomain: false,
      secure: false,
      issued: 0,
      url: '',
      originalUrl: '',
      query: {},
    } as unknown as Handshake,
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  beforeEach(() => {
    presenceService = {
      markOnline: jest.fn(),
      markOffline: jest.fn(),
      refreshTTL: jest.fn(),
      isOnline: jest.fn(),
    } as any;

    jwtService = {
      verify: jest.fn(),
    } as any;

    gateway = new UserGateway(presenceService, jwtService);

    mockServerEmit = jest.fn();

    // Injection du mock de server.emit pour éviter les erreurs
    Object.defineProperty(gateway, 'server', {
      value: { emit: mockServerEmit },
      writable: true,
      configurable: true,
    });
  });

  it('should call markOnline on connection and emit event', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handleConnection(mockSocket('token123') as Socket);

    expect(presenceService.markOnline).toHaveBeenCalledWith('123');
    expect(mockServerEmit).toHaveBeenCalledWith('presence:update', {
      userId: '123',
      online: true,
    });
  });

  it('should call markOffline on disconnect and emit event', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handleDisconnect(mockSocket('token123') as Socket);

    expect(presenceService.markOffline).toHaveBeenCalledWith('123');
    expect(mockServerEmit).toHaveBeenCalledWith('presence:update', {
      userId: '123',
      online: false,
    });
  });

  it('should call refreshTTL on ping', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handlePing(mockSocket('token123') as Socket);
    expect(presenceService.refreshTTL).toHaveBeenCalledWith('123');
  });

  it('should disconnect on ping when token invalid', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad');
    });
    const socket = mockSocket('bad') as Socket;
    gateway.handlePing(socket);

    expect(socket.emit).toHaveBeenCalledWith('auth:refresh');
    expect(socket.disconnect).toHaveBeenCalled();
    expect(presenceService.refreshTTL).not.toHaveBeenCalled();
  });

  it('should disconnect and ask for token refresh on invalid connection token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const socket = mockSocket('bad') as Socket;
    gateway.handleConnection(socket);

    expect(socket.emit).toHaveBeenCalledWith('auth:refresh');
    expect(socket.disconnect).toHaveBeenCalled();
    expect(presenceService.markOnline).not.toHaveBeenCalled();
  });

  it('should disconnect and ask for token refresh on invalid disconnect token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const socket = mockSocket('bad') as Socket;
    gateway.handleDisconnect(socket);

    expect(socket.emit).toHaveBeenCalledWith('auth:refresh');
    expect(socket.disconnect).toHaveBeenCalled();
    expect(presenceService.markOffline).not.toHaveBeenCalled();
  });

  it('handleStatusRequest returns user status', async () => {
    presenceService.isOnline.mockResolvedValueOnce(true);
    const result = await gateway.handleStatusRequest('u1');
    expect(result).toEqual({ userId: 'u1', online: true });
  });

  it('handleBulkStatusRequest returns map of statuses', async () => {
    presenceService.isOnline
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const result = await gateway.handleBulkStatusRequest(['u1', 'u2']);
    expect(result).toEqual({ u1: true, u2: false });
  });

  it('rethrows unknown error on connection', () => {
    const err = new Error('oops');
    jwtService.verify.mockReturnValue({ userId: 'u1' });
    presenceService.markOnline.mockImplementation(() => {
      throw err;
    });
    expect(() => gateway.handleConnection(mockSocket('t') as Socket)).toThrow(err);
  });

  it('rethrows unknown error on disconnect', () => {
    const err = new Error('oops');
    jwtService.verify.mockReturnValue({ userId: 'u1' });
    presenceService.markOffline.mockImplementation(() => {
      throw err;
    });
    expect(() => gateway.handleDisconnect(mockSocket('t') as Socket)).toThrow(err);
  });

  it('rethrows unknown error on ping', () => {
    const err = new Error('oops');
    jwtService.verify.mockReturnValue({ userId: 'u1' });
    presenceService.refreshTTL.mockImplementation(() => {
      throw err;
    });
    expect(() => gateway.handlePing(mockSocket('t') as Socket)).toThrow(err);
  });

  it('should throw JwtNotValid if token is missing', () => {
    expect(() => gateway['extractUserIdFromToken']({ auth: {} })).toThrow(
      JwtNotValid,
    );
  });

  it('should throw JwtNotValid if token is invalid', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('Invalid');
    });

    expect(() =>
      gateway['extractUserIdFromToken']({ auth: { token: 'bad' } }),
    ).toThrow(JwtNotValid);
  });
});
