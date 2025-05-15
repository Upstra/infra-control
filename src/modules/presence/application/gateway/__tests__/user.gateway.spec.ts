import { UserGateway } from '../user.gateway';
import { PresenceService } from '../../services/presence.service';
import { JwtService } from '@nestjs/jwt';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';
import { Socket } from 'socket.io';
import { Handshake } from 'socket.io/dist/socket-types';

describe('UserGateway', () => {
  let gateway: UserGateway;
  let presenceService: jest.Mocked<PresenceService>;
  let jwtService: jest.Mocked<JwtService>;

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
    } as Handshake,
  });

  beforeEach(() => {
    presenceService = {
      markOnline: jest.fn(),
      markOffline: jest.fn(),
      refreshTTL: jest.fn(),
    } as any;

    jwtService = {
      verify: jest.fn(),
    } as any;

    gateway = new UserGateway(presenceService, jwtService);
  });

  it('should call markOnline on connection', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handleConnection(mockSocket('token123') as Socket);
    expect(presenceService.markOnline).toHaveBeenCalledWith('123');
  });

  it('should call markOffline on disconnect', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handleDisconnect(mockSocket('token123') as Socket);
    expect(presenceService.markOffline).toHaveBeenCalledWith('123');
  });

  it('should call refreshTTL on ping', () => {
    jwtService.verify.mockReturnValue({ userId: '123' });
    gateway.handlePing(mockSocket('token123') as Socket);
    expect(presenceService.refreshTTL).toHaveBeenCalledWith('123');
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
