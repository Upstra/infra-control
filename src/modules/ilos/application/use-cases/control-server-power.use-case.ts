import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloPowerAction } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto } from '../dto/ilo-status.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { RequestContextDto } from '@/core/dto';

@Injectable()
export class ControlServerPowerUseCase {
  private readonly logger = new Logger(ControlServerPowerUseCase.name);

  constructor(
    private readonly iloPowerService: IloPowerService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
    @Optional()
    @Inject(LogHistoryUseCase)
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    serverId: string,
    action: IloPowerAction,
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<IloPowerResponseDto> {
    const server = await this.getServerWithIloUseCase.execute(serverId);

    const credentials = {
      user: server.ilo.login,
      password: server.ilo.password,
    };

    try {
      const result = await this.iloPowerService.controlServerPower(
        server.ilo.ip,
        action,
        credentials,
      );

      this.logger.log(
        `Server ${server.name} (${server.ip}) power action '${action}' completed successfully`,
      );

      if (userId && this.logHistory) {
        await this.logHistory.executeStructured({
          entity: 'server',
          entityId: serverId,
          action: 'POWER_CONTROL',
          userId,
          newValue: {
            action,
            status: result.currentStatus,
            message: result.message,
          },
          metadata: {
            serverName: server.name,
            serverIp: server.ip,
            iloIp: server.ilo.ip,
            powerAction: action,
            resultStatus: result.currentStatus,
            success: true,
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }

      return {
        success: result.success,
        message: result.message,
        currentStatus: result.currentStatus,
      };
    } catch (error) {
      this.logger.error(
        `Failed to execute power action '${action}' on server ${server.name} (${server.ip}):`,
        error,
      );

      if (userId && this.logHistory) {
        await this.logHistory.executeStructured({
          entity: 'server',
          entityId: serverId,
          action: 'POWER_CONTROL_FAILED',
          userId,
          metadata: {
            serverName: server.name,
            serverIp: server.ip,
            iloIp: server.ilo.ip,
            powerAction: action,
            error: {
              message: error.message,
              status: error.status ?? 500,
              details: error.response ?? error.stack,
            },
            success: false,
          },
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
        });
      }

      throw error;
    }
  }
}
