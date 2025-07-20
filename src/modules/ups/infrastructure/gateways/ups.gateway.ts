import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UpsBatteryEvents,
  UpsBatteryCheckedEvent,
  UpsBatteryAlertEvent,
} from '../../domain/events/ups-battery.events';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';

@WebSocketGateway({
  namespace: 'ups',
  cors: getWebSocketCorsOptions(),
})
export class UpsGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent(UpsBatteryEvents.BATTERY_CHECKED)
  handleBatteryUpdate(status: UpsBatteryCheckedEvent): void {
    this.server.emit('battery-status', status);
    this.server
      .to(`ups-${status.upsId}`)
      .emit('battery-status-specific', status);
  }

  @OnEvent(UpsBatteryEvents.BATTERY_ALERT)
  handleBatteryAlert(event: UpsBatteryAlertEvent): void {
    this.server.emit('battery-alert', {
      ...event.status,
      upsId: event.upsId,
      upsName: event.upsName,
      severity: this.getSeverity(event.status.alertLevel),
    });
  }

  @SubscribeMessage('subscribe-ups')
  handleSubscribe(
    @MessageBody() data: { upsId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`ups-${data.upsId}`);
    client.emit('subscribed', { upsId: data.upsId });
  }

  @SubscribeMessage('unsubscribe-ups')
  handleUnsubscribe(
    @MessageBody() data: { upsId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`ups-${data.upsId}`);
    client.emit('unsubscribed', { upsId: data.upsId });
  }

  private getSeverity(level: string): number {
    const severityMap = {
      critical: 3,
      warning: 2,
      low: 1,
      normal: 0,
    };
    return severityMap[level] || 0;
  }
}
