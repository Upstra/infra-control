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
    try {
      const userId = this.extractUserIdFromToken(client.handshake);
      this.presenceService.markOnline(userId);
      this.server.emit('presence:update', { userId, online: true });
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        throw error;
      }
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = this.extractUserIdFromToken(client.handshake);
      this.presenceService.markOffline(userId);
      this.server.emit('presence:update', { userId, online: false });
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        throw error;
      }
    }
  }

  @SubscribeMessage('user:ping')
  handlePing(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.extractUserIdFromToken(client.handshake);
      this.presenceService.refreshTTL(userId);
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        throw error;
      }
    }
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

  private handleInvalidToken(client: Socket) {
    client.emit('auth:refresh');
    client.disconnect();
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
