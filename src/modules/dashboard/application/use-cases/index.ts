// Legacy use cases
import { GetDashboardFullStatsUseCase } from './get-dashboard-full-stats.use-case';
import { GetSetupStatisticsUseCase } from './get-setup-statistics.use-case';

// Layout use cases
import {
  CreateLayoutUseCase,
  UpdateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
} from './layouts';

// Widget use cases
import {
  GetActivityFeedUseCase,
  GetAlertsUseCase,
  GetResourceUsageUseCase,
  GetUserPresenceUseCase,
  GetSystemHealthUseCase,
  GetUpsStatusUseCase,
  ExportWidgetDataUseCase,
} from './widgets';

// Preference use cases
import { GetPreferencesUseCase, UpdatePreferencesUseCase } from './preferences';

// Template use cases
import {
  ListTemplatesUseCase,
  CreateLayoutFromTemplateUseCase,
} from './templates';

export const DashboardUseCases = [
  // Legacy
  GetDashboardFullStatsUseCase,
  GetSetupStatisticsUseCase,
  // Layouts
  CreateLayoutUseCase,
  UpdateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
  // Widgets
  GetActivityFeedUseCase,
  GetAlertsUseCase,
  GetResourceUsageUseCase,
  GetUserPresenceUseCase,
  GetSystemHealthUseCase,
  GetUpsStatusUseCase,
  ExportWidgetDataUseCase,
  // Preferences
  GetPreferencesUseCase,
  UpdatePreferencesUseCase,
  // Templates
  ListTemplatesUseCase,
  CreateLayoutFromTemplateUseCase,
];

export {
  // Legacy
  GetDashboardFullStatsUseCase,
  GetSetupStatisticsUseCase,
  // Layouts
  CreateLayoutUseCase,
  UpdateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
  // Widgets
  GetActivityFeedUseCase,
  GetAlertsUseCase,
  GetResourceUsageUseCase,
  GetUserPresenceUseCase,
  GetSystemHealthUseCase,
  GetUpsStatusUseCase,
  ExportWidgetDataUseCase,
  // Preferences
  GetPreferencesUseCase,
  UpdatePreferencesUseCase,
  // Templates
  ListTemplatesUseCase,
  CreateLayoutFromTemplateUseCase,
};