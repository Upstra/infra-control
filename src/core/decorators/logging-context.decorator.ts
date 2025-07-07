import { SetMetadata } from '@nestjs/common';
import {
  LOGGING_CONTEXT_KEY,
  LoggingContext,
} from '../interceptors/logging.interceptor';

/**
 * Decorator to configure logging context for methods or controllers
 */
export const UseLoggingContext = (context: LoggingContext) =>
  SetMetadata(LOGGING_CONTEXT_KEY, context);

/**
 * Decorator to enable automatic history logging for a controller method
 * @param entityType - The type of entity being operated on (e.g., 'user', 'vm', 'server')
 * @param action - The action being performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param options - Additional options for logging
 */
export const LogToHistory = (
  entityType: string,
  action: string,
  options?: {
    extractEntityId?: (data: any) => string;
    extractMetadata?: (data: any, request?: any) => Record<string, any>;
  },
) =>
  UseLoggingContext({
    entityType,
    action,
    logToHistory: true,
    includeRequestContext: true,
    ...options,
  });
