import { Module } from '@nestjs/common';
import { AuditModule } from '../modules/audit/audit.module';
import { LoggingInterceptorProvider } from './providers/logging-interceptor.provider';
import { ActiveUserInterceptorProvider } from './providers/active-user-interceptor.provider';

/**
 * Module that provides global interceptors with their dependencies
 */
@Module({
  imports: [AuditModule],
  providers: [LoggingInterceptorProvider, ActiveUserInterceptorProvider],
  exports: [],
})
export class InterceptorsModule {}
