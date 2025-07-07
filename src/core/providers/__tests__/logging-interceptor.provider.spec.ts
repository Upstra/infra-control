import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { LoggingInterceptorProvider } from '../logging-interceptor.provider';

describe('LoggingInterceptorProvider', () => {
  it('should provide APP_INTERCEPTOR with LoggingInterceptor', () => {
    expect(LoggingInterceptorProvider.provide).toBe(APP_INTERCEPTOR);
    expect(LoggingInterceptorProvider.useClass).toBe(LoggingInterceptor);
  });

  it('should be a valid provider configuration', () => {
    expect(LoggingInterceptorProvider).toBeDefined();
    expect(typeof LoggingInterceptorProvider).toBe('object');
    expect(LoggingInterceptorProvider).toHaveProperty('provide');
    expect(LoggingInterceptorProvider).toHaveProperty('useClass');
  });
});