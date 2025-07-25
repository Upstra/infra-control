import { Injectable, BadRequestException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { IloStatusResponseDto, IloServerStatus } from '../dto/ilo-status.dto';
import { ServerMetricsDto } from '../dto/server-metrics.dto';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import { VmwareServerMetrics } from '@/modules/vmware/domain/interfaces/vmware-vm.interface';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly vmwareService: VmwareService,
    private readonly getServerWithIloUseCase: GetServerWithIloUseCase,
  ) {}

  async execute(
    serverId: string,
    force = false,
  ): Promise<IloStatusResponseDto> {
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

    const metrics = await this.vmwareService.getServerMetrics(
      server.vmwareHostMoid,
      vCenterConnection,
      force,
    );

    const status = this.extractStatusFromMetrics(metrics);

    return {
      status,
      ip: server.ilo.ip,
      serverId: server.id,
      serverName: server.name,
      serverType: server.type,
      vmwareHostMoid: server.vmwareHostMoid,
      serverState: server.state,
      serverPriority: server.priority,
      upsId: server.upsId,
      roomId: server.roomId,
      groupId: server.groupId,
      iloId: server.iloId,
      metrics: this.mapMetricsToDto(metrics),
    };
  }

  private mapMetricsToDto(metrics: VmwareServerMetrics): ServerMetricsDto {
    return {
      cpuUsage: metrics.cpuUsagePercent,
      memoryUsage: metrics.ramUsageMB,
      powerState: metrics.powerState,
      uptime: metrics.uptime,
    };
  }

  private extractStatusFromMetrics(
    metrics: VmwareServerMetrics,
  ): IloServerStatus {
    const powerState = metrics.powerState.toLowerCase();
    if (powerState === 'poweredon' || powerState === 'on') {
      return IloServerStatus.ON;
    } else if (powerState === 'poweredoff' || powerState === 'off') {
      return IloServerStatus.OFF;
    } else if (powerState === 'standby') {
      return IloServerStatus.ERROR;
    }

    return IloServerStatus.ERROR;
  }
}
