import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PythonExecutorService } from '@/core/services/python-executor';
import {
  IloCredentialsDto,
  IloPowerAction,
} from '../../application/dto/ilo-power-action.dto';
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

  async getServerStatus(
    ip: string,
    credentials: IloCredentialsDto,
  ): Promise<IloServerStatus> {
    const args = this.buildIloArgs(ip, credentials);

    try {
      const result = await this.pythonExecutor.executePython('ilo.py', [
        ...args,
        '--status',
      ]);
      return this.parseStatus(result);
    } catch (error) {
      this.logger.error(`Failed to get status for server ${ip}:`, error);
      throw this.handleIloError(error, 'Failed to retrieve server status');
    }
  }

  async controlServerPower(
    ip: string,
    action: IloPowerAction,
    credentials: IloCredentialsDto,
  ): Promise<IloPowerResult> {
    const args = this.buildIloArgs(ip, credentials);
    const actionArg = action === IloPowerAction.START ? '--start' : '--stop';

    try {
      const result = await this.pythonExecutor.executePython('ilo.py', [
        ...args,
        actionArg,
      ]);

      return {
        success: true,
        message:
          result.message ??
          `Server ${action === IloPowerAction.START ? 'started' : 'stopped'} successfully`,
        currentStatus: this.parseStatus(result),
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

  private parseStatus(result: any): IloServerStatus {
    if (typeof result === 'string') {
      const status = result.toUpperCase().trim();
      if (status === 'ON' || status === 'POWEREDON') {
        return IloServerStatus.ON;
      }
      if (status === 'OFF' || status === 'POWEREDOFF') {
        return IloServerStatus.OFF;
      }
      return IloServerStatus.ERROR;
    }

    if (result.status) {
      return this.parseStatus(result.status);
    }

    return IloServerStatus.ERROR;
  }

  private handleIloError(error: any, defaultMessage: string): HttpException {
    const message = error.message ?? defaultMessage;

    if (message.includes('Authentication failed') || message.includes('401')) {
      return new HttpException(
        'Invalid iLO credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (message.includes('not found') || message.includes('404')) {
      return new HttpException('Server not found', HttpStatus.NOT_FOUND);
    }

    if (message.includes('timeout')) {
      return new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT);
    }

    return new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
