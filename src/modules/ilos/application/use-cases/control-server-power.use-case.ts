import { Injectable, NotFoundException } from '@nestjs/common';
import { GetServerByIdUseCase } from '@/modules/servers/application/use-cases/get-server-by-id.use-case';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloPowerAction } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class ControlServerPowerUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    private readonly getServerByIdUseCase: GetServerByIdUseCase,
  ) {}

  async execute(
    serverId: string,
    action: IloPowerAction,
  ): Promise<IloPowerResponseDto> {
    const serverDto = await this.getServerByIdUseCase.execute(serverId);

    if (!serverDto.ilo) {
      throw new NotFoundException(
        `Server ${serverId} does not have an iLO configured`,
      );
    }

    const credentials = {
      user: serverDto.ilo.login,
      password: serverDto.ilo.password,
    };

    const result = await this.iloPowerService.controlServerPower(
      serverDto.ilo.ip,
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
