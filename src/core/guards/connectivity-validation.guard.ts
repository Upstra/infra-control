import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PingService } from '@/core/services/ping';

export interface ConnectivityRequirement {
  hostSource: 'body' | 'params' | 'query';
  hostField: string;
  required?: boolean;
  timeout?: number;
}

export const CONNECTIVITY_KEY = 'connectivity';
export const RequireConnectivity =
  (requirement: ConnectivityRequirement) =>
  (target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      CONNECTIVITY_KEY,
      requirement,
      descriptor?.value ?? target,
    );
  };

@Injectable()
export class ConnectivityValidationGuard implements CanActivate {
  private readonly logger = new Logger(ConnectivityValidationGuard.name);

  constructor(
    private reflector: Reflector,
    private pingService: PingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.get<ConnectivityRequirement>(
      CONNECTIVITY_KEY,
      context.getHandler(),
    );

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const host = this.extractHost(request, requirement);

    if (!host) {
      if (requirement.required === false) {
        return true;
      }
      throw new BadRequestException(
        `Host not provided in ${requirement.hostSource}.${requirement.hostField}`,
      );
    }

    this.logger.log(`Validating connectivity to ${host}`);

    try {
      const result = await this.pingService.ping(host, requirement.timeout);

      if (!result.accessible) {
        throw new BadRequestException(
          `Host ${host} is not accessible: ${result.error ?? 'Unknown error'}`,
        );
      }

      this.logger.log(
        `Connectivity validated for ${host} (${result.responseTime}ms)`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Connectivity validation failed for ${host}: ${error.message}`,
      );
      throw new BadRequestException(
        `Cannot reach host ${host}: ${error.message}`,
      );
    }
  }

  private extractHost(
    request: any,
    requirement: ConnectivityRequirement,
  ): string | null {
    const source = request[requirement.hostSource];
    return source?.[requirement.hostField] ?? null;
  }
}
