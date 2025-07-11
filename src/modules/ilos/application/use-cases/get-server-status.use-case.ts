import { Injectable, NotFoundException } from '@nestjs/common';
import { GetServerByIdUseCase } from '@/modules/servers/application/use-cases/get-server-by-id.use-case';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloStatusResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    private readonly getServerByIdUseCase: GetServerByIdUseCase,
  ) {}

  async execute(serverId: string): Promise<IloStatusResponseDto> {
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

    const status = await this.iloPowerService.getServerStatus(
      serverDto.ilo.ip,
      credentials,
    );

    return {
      status,
      ip: serverDto.ilo.ip,
    };
  }
}
