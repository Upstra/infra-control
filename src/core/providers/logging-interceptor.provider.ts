import { Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

/**
 * Global provider for LoggingInterceptor
 * This allows the interceptor to have access to LogHistoryUseCase
 * through dependency injection
 */
export const LoggingInterceptorProvider: Provider = {
  provide: APP_INTERCEPTOR,
  useClass: LoggingInterceptor,
};
