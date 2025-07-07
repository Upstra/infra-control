import { Injectable } from '@nestjs/common';
import {
  AlertsResponseDto,
  WidgetDataQueryDto,
} from '../../dto/widget-data.dto';

@Injectable()
export class GetAlertsUseCase {
  async execute(query: WidgetDataQueryDto): Promise<AlertsResponseDto> {
    // TODO: Implement real alerts logic
    // This is a placeholder implementation

    const mockAlerts = [
      {
        id: 'alert-001',
        severity: 'critical' as const,
        type: 'server_down',
        resource: {
          type: 'server',
          id: 'server-123',
          name: 'web-server-01',
        },
        message: 'Server is not responding',
        timestamp: new Date(),
        acknowledged: false,
      },
      {
        id: 'alert-002',
        severity: 'warning' as const,
        type: 'high_cpu',
        resource: {
          type: 'vm',
          id: 'vm-456',
          name: 'app-vm-02',
        },
        message: 'CPU usage above 90%',
        timestamp: new Date(),
        acknowledged: false,
      },
      {
        id: 'alert-003',
        severity: 'info' as const,
        type: 'maintenance_scheduled',
        resource: {
          type: 'server',
          id: 'server-789',
          name: 'backup-server-01',
        },
        message: 'Scheduled maintenance in 2 hours',
        timestamp: new Date(),
        acknowledged: false,
      },
    ];

    const filteredAlerts = query.severity
      ? mockAlerts.filter((alert) => alert.severity === query.severity)
      : mockAlerts;

    const summary = {
      critical: mockAlerts.filter((a) => a.severity === 'critical').length,
      warning: mockAlerts.filter((a) => a.severity === 'warning').length,
      info: mockAlerts.filter((a) => a.severity === 'info').length,
    };

    return {
      alerts: filteredAlerts,
      summary,
    };
  }
}
