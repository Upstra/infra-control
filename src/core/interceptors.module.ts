import { Module } from '@nestjs/common';
import { AuditModule } from '../modules/audit/audit.module';
import { LoggingInterceptorProvider } from './providers/logging-interceptor.provider';

/**
 * Module that provides global interceptors with their dependencies
 */
@Module({
  imports: [AuditModule],
  providers: [LoggingInterceptorProvider],
  exports: [],
})
export class InterceptorsModule {}