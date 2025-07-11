import { Injectable } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloPowerAction } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class ControlServerPowerUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
  ) {}

  async execute(
    serverId: string,
    action: IloPowerAction,
  ): Promise<IloPowerResponseDto> {
    const server = await this.getServerWithIloUseCase.execute(serverId);

    const credentials = {
      user: server.ilo.login,
      password: server.ilo.password,
    };

    const result = await this.iloPowerService.controlServerPower(
      server.ilo.ip,
      action,
      credentials,
    );

    return {
      success: result.success,
      message: result.message,
      currentStatus: result.currentStatus,
    };
  }
}
