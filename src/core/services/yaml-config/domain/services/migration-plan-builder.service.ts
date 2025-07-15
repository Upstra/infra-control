import { Injectable } from '@nestjs/common';
import {
  MigrationPlanConfig,
  ServerMigrationConfig,
  VCenterConfig,
  UpsConfig,
} from '../interfaces/yaml-config.interface';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';

@Injectable()
export class MigrationPlanBuilderService {
  buildMigrationPlan(
    servers: Server[],
    vms: Vm[],
    ilos: Map<string, Ilo>,
    vCenterConfig: VCenterConfig,
    upsConfig: UpsConfig,
    destinationServers?: Map<string, Server>,
  ): MigrationPlanConfig {
    const serverConfigs = servers.map((server) =>
      this.buildServerConfig(server, vms, ilos, destinationServers),
    );

    return {
      vCenter: vCenterConfig,
      ups: upsConfig,
      servers: serverConfigs,
    };
  }

  private buildServerConfig(
    server: Server,
    vms: Vm[],
    ilos: Map<string, Ilo>,
    destinationServers?: Map<string, Server>,
  ): ServerMigrationConfig {
    const serverVms = this.getServerVms(server, vms);
    const sortedVms = this.sortVmsByPriority(serverVms);
    const serverIlo = this.getServerIlo(server, ilos);
    const destinationServer = destinationServers?.get(server.id);
    const destinationIlo = this.getServerIlo(destinationServer, ilos);

    const config: ServerMigrationConfig = {
      server: {
        host: {
          name: server.name,
          moid: server.vmwareHostMoid || '',
          ...(serverIlo && {
            ilo: {
              ip: serverIlo.ip,
              user: serverIlo.login,
              password: serverIlo.password,
            },
          }),
        },
        vmOrder: sortedVms.map((vm) => ({ vmMoId: vm.moid })),
      },
    };

    if (destinationServer && destinationServer.vmwareHostMoid) {
      config.server.destination = {
        name: destinationServer.name,
        moid: destinationServer.vmwareHostMoid,
        ...(destinationIlo && {
          ilo: {
            ip: destinationIlo.ip,
            user: destinationIlo.login,
            password: destinationIlo.password,
          },
        }),
      };
    }

    return config;
  }

  private getServerVms(server: Server, vms: Vm[]): Vm[] {
    return vms.filter((vm) => vm.serverId === server.id);
  }

  private sortVmsByPriority(vms: Vm[]): Vm[] {
    return [...vms].sort((a, b) => a.priority - b.priority);
  }

  private getServerIlo(
    server: Server | undefined,
    ilos: Map<string, Ilo>,
  ): Ilo | null {
    if (!server?.iloId) return null;
    return ilos.get(server.iloId) || null;
  }
}
