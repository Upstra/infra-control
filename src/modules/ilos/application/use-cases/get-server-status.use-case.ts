import { Injectable } from '@nestjs/common';
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
    const server = await this.getServerWithIloUseCase.execute(serverId);

    const credentials = {
      user: server.ilo.login,
      password: server.ilo.password,
    };

    const status = await this.iloPowerService.getServerStatus(
      server.ilo.ip,
      credentials,
    );

    return {
      status,
      ip: server.ilo.ip,
    };
  }
}
