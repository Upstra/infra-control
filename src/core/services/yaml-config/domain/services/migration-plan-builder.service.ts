import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(MigrationPlanBuilderService.name);
  buildMigrationPlan(
    servers: Server[],
    vms: Vm[],
    ilos: Map<
      string,
      Ilo | { id: string; ip: string; login: string; password: string }
    >,
    vCenterConfig: VCenterConfig,
    upsConfig: UpsConfig,
    destinationServers?: Map<string, Server>,
  ): MigrationPlanConfig {
    const serverConfigs = servers.map((server) =>
      this.buildServerConfig(server, vms, ilos, destinationServers),
    );

    this.logger.debug(
      `Building migration plan with ${serverConfigs.length} servers and vCenter config: ${JSON.stringify(vCenterConfig)} with a password length of ${vCenterConfig.password?.length ?? 0}`,
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
    ilos: Map<
      string,
      Ilo | { id: string; ip: string; login: string; password: string }
    >,
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
    ilos: Map<
      string,
      Ilo | { id: string; ip: string; login: string; password: string }
    >,
  ): { id: string; ip: string; login: string; password: string } | null {
    if (!server?.iloId) return null;
    const ilo = ilos.get(server.iloId);
    if (!ilo) return null;

    // Return a normalized object whether it's an Ilo entity or plain object
    return {
      id: ilo.id,
      ip: ilo.ip,
      login: ilo.login,
      password: ilo.password,
    };
  }
}
