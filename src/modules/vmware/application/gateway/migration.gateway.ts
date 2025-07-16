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
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';
import {
  MigrationEvent,
  MigrationState,
} from '../../domain/interfaces/migration-orchestrator.interface';

@WebSocketGateway({
  namespace: 'migration',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MigrationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MigrationGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  constructor(
    private readonly migrationOrchestrator: MigrationOrchestratorService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    const status = await this.migrationOrchestrator.getMigrationStatus();
    client.emit('migration:status', status);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
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
      await this.migrationOrchestrator.executeMigrationPlan(data.planPath);
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
      await this.migrationOrchestrator.executeRestartPlan();
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
}
