import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RequestContextDto } from '../dto/request-context.dto';
import { LogHistoryUseCase } from '../../modules/history/application/use-cases/log-history.use-case';

export const LOGGING_CONTEXT_KEY = 'loggingContext';

/**
 * Metadata interface for logging context
 */
export interface LoggingContext {
  entityType?: string;
  action?: string;
  includeRequestContext?: boolean;
  logToHistory?: boolean;
  extractEntityId?: (data: any) => string;
  extractMetadata?: (data: any, request?: any) => Record<string, any>;
}

/**
 * Interceptor that automatically logs actions with request context
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    const loggingContext = this.reflector.getAllAndOverride<LoggingContext>(
      LOGGING_CONTEXT_KEY,
      [handler, controller],
    );

    if (!loggingContext) {
      return next.handle();
    }

    const requestContext = RequestContextDto.fromRequest(request);
    const user = request.user;
    const method = request.method;
    const url = request.originalUrl;

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log({
            message: `${method} ${url} completed`,
            entityType: loggingContext.entityType,
            action: loggingContext.action,
            userId: user?.userId,
            responseTime,
            ...(loggingContext.includeRequestContext && {
              requestContext: {
                ipAddress: requestContext.ipAddress,
                userAgent: requestContext.userAgent,
                sessionId: requestContext.sessionId,
              },
            }),
            result: this.simplifyResult(data),
          });

          this.logToHistoryAsync(
            loggingContext,
            data,
            user,
            request,
            requestContext,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error({
            message: `${method} ${url} failed`,
            entityType: loggingContext.entityType,
            action: loggingContext.action,
            userId: user?.userId,
            responseTime,
            error: error.message,
            ...(loggingContext.includeRequestContext && {
              requestContext: {
                ipAddress: requestContext.ipAddress,
                userAgent: requestContext.userAgent,
                sessionId: requestContext.sessionId,
              },
            }),
          });
        },
      }),
    );
  }

  private async logToHistoryAsync(
    loggingContext: LoggingContext,
    data: any,
    user: any,
    request: any,
    requestContext: RequestContextDto,
  ): Promise<void> {
    if (
      loggingContext.logToHistory &&
      this.logHistory &&
      loggingContext.entityType &&
      loggingContext.action
    ) {
      try {
        const entityId = loggingContext.extractEntityId?.(data) ?? data?.id;
        if (entityId) {
          await this.logHistory.executeStructured({
            entity: loggingContext.entityType,
            entityId,
            action: loggingContext.action,
            userId: user?.userId,
            newValue: data,
            metadata: loggingContext.extractMetadata?.(data, request) ?? {},
            ipAddress: requestContext.ipAddress,
            userAgent: requestContext.userAgent,
          });
        }
      } catch (error) {
        this.logger.error('Failed to log to history', error);
      }
    }
  }

  private simplifyResult(data: any): any {
    if (!data) return undefined;

    if (typeof data !== 'object' || data.id) {
      return data.id ?? data;
    }

    if (Array.isArray(data)) {
      return { count: data.length };
    }

    if ('totalServers' in data && 'totalVms' in data) {
      return { totalServers: data.totalServers, totalVms: data.totalVms };
    }

    if ('destinations' in data && Array.isArray(data.destinations)) {
      return { destinationCount: data.destinations.length };
    }

    return { keys: Object.keys(data) };
  }
}
