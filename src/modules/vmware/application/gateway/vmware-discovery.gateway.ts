import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DiscoveryProgressDto } from '../dto/discovery-progress.dto';
import { DiscoveryResultsDto } from '../dto/discovery-results.dto';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';

@WebSocketGateway({
  cors: getWebSocketCorsOptions(),
  namespace: '/discovery',
})
export class VmwareDiscoveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VmwareDiscoveryGateway.name);
  private readonly activeSessions = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.cleanupClientSessions(client.id);
  }

  @SubscribeMessage('join')
  handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!sessionId) {
      client.emit('error', { message: 'Session ID is required' });
      return;
    }

    client.join(sessionId);

    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, new Set());
    }
    this.activeSessions.get(sessionId)!.add(client.id);

    this.logger.log(`Client ${client.id} joined session ${sessionId}`);
    client.emit('joined', { sessionId });
  }

  @SubscribeMessage('leave')
  handleLeaveSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(sessionId);

    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId)!.delete(client.id);
      if (this.activeSessions.get(sessionId)!.size === 0) {
        this.activeSessions.delete(sessionId);
      }
    }

    this.logger.log(`Client ${client.id} left session ${sessionId}`);
    client.emit('left', { sessionId });
  }

  emitDiscoveryProgress(
    sessionId: string,
    progress: DiscoveryProgressDto,
  ): void {
    if (!sessionId) {
      this.logger.warn('Cannot emit progress: sessionId is required');
      return;
    }

    const progressWithTimestamp = {
      ...progress,
      timestamp: new Date(),
    };

    this.server.to(sessionId).emit('discovery:progress', progressWithTimestamp);
    this.logger.debug(
      `Emitted progress to session ${sessionId}: ${progress.status}`,
    );
  }

  emitDiscoveryComplete(sessionId: string, results: DiscoveryResultsDto): void {
    if (!sessionId) {
      this.logger.warn('Cannot emit completion: sessionId is required');
      return;
    }

    this.server.to(sessionId).emit('discovery:complete', results);
    this.logger.log(
      `Emitted completion to session ${sessionId}: ${results.totalVmsDiscovered} VMs discovered`,
    );
  }

  emitDiscoveryError(sessionId: string, error: string): void {
    if (!sessionId) {
      this.logger.warn('Cannot emit error: sessionId is required');
      return;
    }

    this.server
      .to(sessionId)
      .emit('discovery:error', { error, timestamp: new Date() });
    this.logger.error(`Emitted error to session ${sessionId}: ${error}`);
  }

  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  getClientsInSession(sessionId: string): number {
    return this.activeSessions.get(sessionId)?.size ?? 0;
  }

  private cleanupClientSessions(clientId: string): void {
    for (const [sessionId, clients] of this.activeSessions.entries()) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.activeSessions.delete(sessionId);
        this.logger.log(`Cleaned up empty session: ${sessionId}`);
      }
    }
  }
}
