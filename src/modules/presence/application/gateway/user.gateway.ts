import { PresenceService } from '../services/presence.service';
import {
  WebSocketGateway,
  ConnectedSocket,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';

@WebSocketGateway({ cors: true })
export class UserGateway {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.markOnline(userId);
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.markOffline(userId);
  }

  @SubscribeMessage('user:ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.refreshTTL(userId);
  }

  private extractUserIdFromToken(handshake: any): string {
    const token = handshake.auth?.token;
    if (!token) throw new JwtNotValid();

    try {
      const payload = this.jwtService.verify(token);
      return payload.userId;
    } catch {
      throw new JwtNotValid();
    }
  }
}
