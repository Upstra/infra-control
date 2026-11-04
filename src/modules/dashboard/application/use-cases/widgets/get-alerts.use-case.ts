import { Injectable } from '@nestjs/common';
import { ListOpenAlertsUseCase } from '@/modules/alerts/application/use-cases/list-open-alerts.use-case';
import { GetAlertSummaryUseCase } from '@/modules/alerts/application/use-cases/get-alert-summary.use-case';
import { Alert } from '@/modules/alerts/domain/entities/alert.entity';
import {
  AlertDto,
  AlertsResponseDto,
  WidgetDataQueryDto,
} from '../../dto/widget-data.dto';

const WIDGET_ALERT_LIMIT = 50;

@Injectable()
export class GetAlertsUseCase {
  constructor(
    private readonly listOpenAlertsUseCase: ListOpenAlertsUseCase,
    private readonly getAlertSummaryUseCase: GetAlertSummaryUseCase,
  ) {}

  async execute(query: WidgetDataQueryDto): Promise<AlertsResponseDto> {
    const [alerts, summary] = await Promise.all([
      this.listOpenAlertsUseCase.execute(WIDGET_ALERT_LIMIT),
      this.getAlertSummaryUseCase.execute(),
    ]);

    const filtered = query.severity
      ? alerts.filter((alert) => alert.severity === query.severity)
      : alerts;

    return {
      alerts: filtered.map((alert) => this.toDto(alert)),
      summary: summary.open,
    };
  }

  private toDto(alert: Alert): AlertDto {
    return {
      id: alert.id,
      severity: alert.severity,
      type: alert.type,
      resource: {
        type: alert.resourceType,
        id: alert.resourceId,
        name: alert.resourceName,
      },
      message: alert.message,
      timestamp: alert.openedAt,
      acknowledged: alert.acknowledgedAt !== null,
    };
  }
}
