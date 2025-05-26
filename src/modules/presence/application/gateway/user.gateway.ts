import { PresenceService } from '../services/presence.service';
import {
  WebSocketGateway,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';

@WebSocketGateway({ cors: true })
export class UserGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
  ) {}
  handleConnection(client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.markOnline(userId);
    this.server.emit('presence:update', { userId, online: true });
  }

  handleDisconnect(client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.markOffline(userId);
    this.server.emit('presence:update', { userId, online: false });
  }

  @SubscribeMessage('user:ping')
  handlePing(@ConnectedSocket() client: Socket) {
    const userId = this.extractUserIdFromToken(client.handshake);
    this.presenceService.refreshTTL(userId);
  }

  @SubscribeMessage('presence:status-request')
  async handleStatusRequest(
    @MessageBody() userId: string,
  ): Promise<{ userId: string; online: boolean }> {
    const isOnline = await this.presenceService.isOnline(userId);
    return { userId, online: isOnline };
  }

  @SubscribeMessage('presence:bulk-status-request')
  async handleBulkStatusRequest(
    @MessageBody() userIds: string[],
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const userId of userIds) {
      results[userId] = await this.presenceService.isOnline(userId);
    }

    return results;
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
