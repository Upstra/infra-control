import { AcknowledgeAlertUseCase } from './acknowledge-alert.use-case';
import { GetAlertByIdUseCase } from './get-alert-by-id.use-case';
import { GetAlertSummaryUseCase } from './get-alert-summary.use-case';
import { GetEventsFeedUseCase } from './get-events-feed.use-case';
import { ListAlertsUseCase } from './list-alerts.use-case';
import { ListOpenAlertsUseCase } from './list-open-alerts.use-case';

export const AlertUseCases = [
  ListAlertsUseCase,
  ListOpenAlertsUseCase,
  GetAlertSummaryUseCase,
  GetAlertByIdUseCase,
  AcknowledgeAlertUseCase,
  GetEventsFeedUseCase,
];

export {
  ListAlertsUseCase,
  ListOpenAlertsUseCase,
  GetAlertSummaryUseCase,
  GetAlertByIdUseCase,
  AcknowledgeAlertUseCase,
  GetEventsFeedUseCase,
};
