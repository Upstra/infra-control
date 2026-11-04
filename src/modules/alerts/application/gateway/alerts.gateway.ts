import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';
import {
  AlertEvents,
  AlertTransitionEvent,
} from '../../domain/events/alert.events';
import { AlertTransitionType } from '../../domain/types/alert.types';
import { AlertResponseDto } from '../dto/alert.response.dto';
import { GetAlertSummaryUseCase } from '../use-cases/get-alert-summary.use-case';

const SOCKET_EVENTS: Record<AlertTransitionType, string> = {
  [AlertTransitionType.OPENED]: 'alert:opened',
  [AlertTransitionType.ESCALATED]: 'alert:updated',
  [AlertTransitionType.DEESCALATED]: 'alert:updated',
  [AlertTransitionType.UNACKNOWLEDGED]: 'alert:updated',
  [AlertTransitionType.ACKNOWLEDGED]: 'alert:acknowledged',
  [AlertTransitionType.RESOLVED]: 'alert:resolved',
};

@WebSocketGateway({
  cors: getWebSocketCorsOptions(),
  namespace: '/alerts',
})
export class AlertsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly getAlertSummaryUseCase: GetAlertSummaryUseCase,
  ) {}

  @OnEvent(AlertEvents.TRANSITION, { async: true })
  async handleTransition({ alert, transition }: AlertTransitionEvent) {
    this.server.emit(
      SOCKET_EVENTS[transition.type],
      new AlertResponseDto(alert),
    );
    this.server.emit(
      'alerts:summary',
      await this.getAlertSummaryUseCase.execute(),
    );
  }
}
