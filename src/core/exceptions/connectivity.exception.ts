import { BadRequestException } from '@nestjs/common';

export class ConnectivityException extends BadRequestException {
  constructor(host: string, error?: string) {
    super(`Host ${host} is not accessible${error ? `: ${error}` : ''}`);
  }
}

export class TimeoutException extends BadRequestException {
  constructor(host: string, timeout: number) {
    super(`Connection to ${host} timed out after ${timeout}ms`);
  }
}

export class HostUnreachableException extends BadRequestException {
  constructor(host: string) {
    super(`Host ${host} is unreachable - please check network connectivity`);
  }
}
