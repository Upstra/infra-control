import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { getWebSocketCorsOptions } from '@/core/config/cors.config';
import {
  VmPoweredOffEvent,
  VmwareMetricsCollectedEvent,
  VmwareTelemetryEvents,
} from '../../domain/events/vmware-telemetry.events';

@WebSocketGateway({
  cors: getWebSocketCorsOptions(),
  namespace: '/vmware',
})
export class VmwareTelemetryGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent(VmwareTelemetryEvents.METRICS_COLLECTED)
  handleMetrics(event: VmwareMetricsCollectedEvent): void {
    if (event.changedVms.length === 0 && event.changedHosts.length === 0) {
      return;
    }
    this.server.emit('vmware:metrics', {
      collectedAt: event.collectedAt,
      vms: event.changedVms,
      hosts: event.changedHosts,
    });
  }

  @OnEvent(VmwareTelemetryEvents.VM_POWERED_OFF)
  handlePoweredOff(event: VmPoweredOffEvent): void {
    this.server.emit('vmware:vm-powered-off', event);
  }
}
