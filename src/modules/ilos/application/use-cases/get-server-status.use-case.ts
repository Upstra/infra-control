import { Injectable, BadRequestException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { IloStatusResponseDto, IloServerStatus } from '../dto/ilo-status.dto';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly vmwareService: VmwareService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
  ) {}

  async execute(serverId: string): Promise<IloStatusResponseDto> {
    if (!serverId || typeof serverId !== 'string' || serverId.trim() === '') {
      throw new BadRequestException(
        'Server ID must be a valid non-empty string',
      );
    }

    const server = await this.getServerWithIloUseCase.execute(serverId);

    if (!server.vmwareHostMoid) {
      throw new BadRequestException(
        `Server ${serverId} does not have a VMware host moid configured`,
      );
    }

    const vCenterConnection: VmwareConnectionDto = {
      host: server.ip,
      user: server.login,
      password: server.password,
      port: 443,
    };

    console.log('Server credentials check:', {
      serverId: server.id,
      hasPassword: !!server.password,
      passwordLength: server.password?.length,
    });

    const metrics = await this.vmwareService.getServerMetrics(
      server.vmwareHostMoid,
      vCenterConnection,
    );

    const status = this.extractStatusFromMetrics(metrics);

    return {
      status,
      ip: server.ilo.ip,
    };
  }

  private extractStatusFromMetrics(metrics: any): IloServerStatus {
    if (!metrics || !metrics.powerState) {
      return IloServerStatus.ERROR;
    }

    const powerState = metrics.powerState.toLowerCase();
    if (powerState === 'poweredon' || powerState === 'on') {
      return IloServerStatus.ON;
    } else if (powerState === 'poweredoff' || powerState === 'off') {
      return IloServerStatus.OFF;
    }

    return IloServerStatus.ERROR;
  }
}
