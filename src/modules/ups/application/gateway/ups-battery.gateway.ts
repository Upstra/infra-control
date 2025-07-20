import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';
import { UpsBatteryEvents } from '../../domain/events/ups-battery.events';
import { UPSBatteryStatusDto } from '../../domain/interfaces/ups-battery-status.interface';
import { GetUpsBatteryUseCase } from '../use-cases/get-ups-battery.use-case';

@WebSocketGateway({
  cors: getWebSocketCorsOptions(),
  namespace: '/ups',
})
export class UpsBatteryGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly getUpsBatteryUseCase: GetUpsBatteryUseCase) {}

  @OnEvent(UpsBatteryEvents.BATTERY_CHECKED)
  handleBatteryChecked(status: UPSBatteryStatusDto) {
    this.server.emit('battery:status', status);
  }

  @OnEvent(UpsBatteryEvents.BATTERY_ALERT)
  handleBatteryAlert(payload: any) {
    this.server.emit('battery:alert', payload);
  }

  @SubscribeMessage('battery:request-status')
  async handleBatteryStatusRequest(
    @MessageBody() upsId: string,
  ): Promise<UPSBatteryStatusDto> {
    return await this.getUpsBatteryUseCase.execute(upsId);
  }

  @SubscribeMessage('battery:request-bulk-status')
  async handleBulkBatteryStatusRequest(
    @MessageBody() upsIds: string[],
  ): Promise<Record<string, UPSBatteryStatusDto | null>> {
    const results: Record<string, UPSBatteryStatusDto | null> = {};

    await Promise.all(
      upsIds.map(async (upsId) => {
        try {
          results[upsId] = await this.getUpsBatteryUseCase.execute(upsId);
        } catch {
          results[upsId] = null;
        }
      }),
    );

    return results;
  }
}
