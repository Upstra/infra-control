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
import { getWebSocketCorsOptions } from '@/core/config/cors.config';
import { PresenceDomainService } from '../../domain/services/presence.domain.service';
import {
  PresenceRecord,
  PresenceViewer,
} from '../../domain/interfaces/presence.interface';

export const PRESENCE_FULL_ROOM = 'presence:full';
export const PRESENCE_LIMITED_ROOM = 'presence:limited';

interface PingBody {
  route?: unknown;
  title?: unknown;
  active?: unknown;
}

@WebSocketGateway({
  cors: getWebSocketCorsOptions(),
})
export class UserGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
    private readonly presenceDomain: PresenceDomainService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const viewer = this.extractViewer(client.handshake);
      await client.join(
        this.presenceDomain.canSeeActivity(viewer)
          ? PRESENCE_FULL_ROOM
          : PRESENCE_LIMITED_ROOM,
      );
      const record = await this.presenceService.markOnline(viewer.userId);
      this.broadcast(viewer.userId, record);
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        throw error;
      }
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const viewer = this.extractViewer(client.handshake);
      await this.presenceService.markOffline(viewer.userId);
      this.broadcast(viewer.userId, null);
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        throw error;
      }
    }
  }

  @SubscribeMessage('user:ping')
  async handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() body?: PingBody,
  ) {
    try {
      const viewer = this.extractViewer(client.handshake);
      const record = await this.presenceService.recordActivity(viewer.userId, {
        route: this.presenceDomain.sanitizeRoute(body?.route),
        title: this.presenceDomain.sanitizeTitle(body?.title),
        active: body?.active !== false,
      });
      this.broadcast(viewer.userId, record);
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

  broadcast(userId: string, record: PresenceRecord | null): void {
    this.server
      .to(PRESENCE_FULL_ROOM)
      .emit(
        'presence:update',
        this.presenceDomain.toView(userId, record, true),
      );
    this.server
      .to(PRESENCE_LIMITED_ROOM)
      .emit(
        'presence:update',
        this.presenceDomain.toView(userId, record, false),
      );
  }

  private handleInvalidToken(client: Socket) {
    client.emit('auth:refresh');
    client.disconnect();
  }

  private extractViewer(handshake: any): PresenceViewer {
    const token = handshake.auth?.token;
    if (!token) throw new JwtNotValid();

    try {
      const payload = this.jwtService.verify(token);
      if (!payload?.userId) throw new JwtNotValid();
      return { userId: payload.userId, isActive: payload.isActive };
    } catch {
      throw new JwtNotValid();
    }
  }
}
