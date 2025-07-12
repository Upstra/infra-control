import { Injectable, BadRequestException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloStatusResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
  ) {}

  async execute(serverId: string): Promise<IloStatusResponseDto> {
    if (!serverId || typeof serverId !== 'string' || serverId.trim() === '') {
      throw new BadRequestException(
        'Server ID must be a valid non-empty string',
      );
    }

    const server = await this.getServerWithIloUseCase.execute(serverId);

    const credentials = {
      user: server.ilo.login,
      password: server.ilo.password,
    };

    const status = await this.iloPowerService.getServerPowerState(
      server.ilo.ip,
      credentials,
    );

    return {
      status,
      ip: server.ilo.ip,
    };
  }
}
