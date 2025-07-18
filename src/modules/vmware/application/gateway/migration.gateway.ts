import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';
import {
  MigrationEvent,
  MigrationState,
} from '../../domain/interfaces/migration-orchestrator.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { RequestContextDto } from '@/core/dto/request-context.dto';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';

@WebSocketGateway({
  namespace: 'migration',
  cors: getWebSocketCorsOptions(),
})
export class MigrationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MigrationGateway.name);
  private readonly connectedClients = new Map<string, Socket>();
  private readonly userSessions = new Map<string, string>();

  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
    private readonly jwtService: JwtService,
    private readonly logHistoryUseCase: LogHistoryUseCase,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = this.extractUserIdFromToken(client);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      this.connectedClients.set(client.id, client);
      this.userSessions.set(client.id, userId);

      const status = await this.migrationOrchestrator.getMigrationStatus();
      client.emit('migration:status', status);
    } catch (error) {
      if (error instanceof JwtNotValid) {
        this.handleInvalidToken(client);
      } else {
        this.logger.error('Connection error:', error);
        client.disconnect();
      }
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.userSessions.delete(client.id);
  }

  @SubscribeMessage('migration:getStatus')
  async handleGetStatus(@ConnectedSocket() client: Socket): Promise<void> {
    const status = await this.migrationOrchestrator.getMigrationStatus();
    client.emit('migration:status', status);
  }

  @SubscribeMessage('migration:start')
  async handleStartMigration(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { planPath: string },
  ): Promise<void> {
    try {
      const userId = this.userSessions.get(client.id);
      if (!userId) {
        throw new JwtNotValid();
      }

      const requestContext = RequestContextDto.fromSocket(client);

      await this.migrationOrchestrator.executeMigrationPlan(
        data.planPath,
        userId,
        requestContext,
      );
      client.emit('migration:started', { success: true });
    } catch (error) {
      client.emit('migration:error', {
        message: error.message,
      });
    }
  }

  @SubscribeMessage('migration:restart')
  async handleRestartMigration(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const userId = this.userSessions.get(client.id);
      if (!userId) {
        throw new JwtNotValid();
      }

      const requestContext = RequestContextDto.fromSocket(client);

      await this.migrationOrchestrator.executeRestartPlan(
        userId,
        requestContext,
      );
      client.emit('migration:restarted', { success: true });
    } catch (error) {
      client.emit('migration:error', {
        message: error.message,
      });
    }
  }

  @SubscribeMessage('migration:cancel')
  async handleCancelMigration(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const userId = this.userSessions.get(client.id);
      if (!userId) {
        throw new JwtNotValid();
      }

      const requestContext = RequestContextDto.fromSocket(client);
      const sessionId = client.id;

      this.logHistoryUseCase
        .executeStructured({
          entity: 'migration',
          entityId: sessionId,
          action: 'CANCEL_MIGRATION',
          userId,
          metadata: {},
          ipAddress: requestContext.ipAddress,
          userAgent: requestContext.userAgent,
        })
        .catch((error) =>
          this.logger.error('Failed to log migration cancel:', error),
        );

      await this.migrationOrchestrator.cancelMigration();
      client.emit('migration:cancelled', { success: true });
    } catch (error) {
      client.emit('migration:error', {
        message: error.message,
      });
    }
  }

  @OnEvent('migration.stateChange')
  handleStateChange(data: { state: MigrationState }): void {
    this.server.emit('migration:stateChange', data);
  }

  @OnEvent('migration.event')
  handleMigrationEvent(event: MigrationEvent): void {
    this.server.emit('migration:event', event);
  }

  @OnEvent('migration.operationChange')
  handleOperationChange(data: { operation: string }): void {
    this.server.emit('migration:operationChange', data);
  }

  private handleInvalidToken(client: Socket): void {
    client.emit('auth:refresh');
    client.disconnect();
  }

  private extractUserIdFromToken(client: Socket): string {
    const token = client.handshake.auth?.token;
    if (!token) throw new JwtNotValid();

    try {
      const payload = this.jwtService.verify(token);
      return payload.userId;
    } catch {
      throw new JwtNotValid();
    }
  }
}
