import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PythonExecutorService } from '@/core/services/python-executor';
import { IloPowerAction } from '../../application/dto/ilo-power-action.dto';
import { IloCredentialsDto } from '../../application/dto/ilo-credentials.dto';
import { IloServerStatus } from '../../application/dto/ilo-status.dto';

export interface IloPowerResult {
  success: boolean;
  message: string;
  currentStatus: IloServerStatus;
}

@Injectable()
export class IloPowerService {
  private readonly logger = new Logger(IloPowerService.name);

  constructor(private readonly pythonExecutor: PythonExecutorService) {}

  async controlServerPower(
    ip: string,
    action: IloPowerAction,
    credentials: IloCredentialsDto,
  ): Promise<IloPowerResult> {
    const args = this.buildIloArgs(ip, credentials);
    const scriptName =
      action === IloPowerAction.START ? 'server_start.sh' : 'server_stop.sh';

    try {
      const result = await this.pythonExecutor.executePython(scriptName, args);

      return {
        success: true,
        message:
          result.result?.message ??
          `Server ${action === IloPowerAction.START ? 'started' : 'stopped'} successfully`,
        currentStatus:
          action === IloPowerAction.START
            ? IloServerStatus.ON
            : IloServerStatus.OFF,
      };
    } catch (error) {
      this.logger.error(`Failed to ${action} server ${ip}:`, error);
      throw this.handleIloError(error, `Failed to ${action} server`);
    }
  }

  private buildIloArgs(ip: string, credentials: IloCredentialsDto): string[] {
    return [
      '--ip',
      ip,
      '--user',
      credentials.user,
      '--password',
      credentials.password,
    ];
  }

  private handleIloError(error: any, defaultMessage: string): HttpException {
    const message = error.message ?? defaultMessage;
    const httpCode = error.result?.httpCode ?? error.httpCode;

    if (httpCode === 401 || message.includes('Authentication failed')) {
      return new HttpException(
        'Invalid iLO credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (httpCode === 404 || message.includes('not found')) {
      return new HttpException('Server not found', HttpStatus.NOT_FOUND);
    }

    if (httpCode === 403) {
      return new HttpException('Action forbidden', HttpStatus.FORBIDDEN);
    }

    if (message.includes('timeout')) {
      return new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    return new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
