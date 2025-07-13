import { Injectable, Logger } from '@nestjs/common';
import { VmwareService } from './vmware.service';
import { VmwareDiscoveryGateway } from '../../application/gateway/vmware-discovery.gateway';
import { Server } from '../../../servers/domain/entities/server.entity';
import {
  DiscoveryProgressDto,
  DiscoveryResultsDto,
  DiscoveredVmDto,
  DiscoveryStatus,
} from '../../application/dto';
import { VmwareConnectionDto } from '../../application/dto/vmware-connection.dto';

export interface ServerDiscoveryResult {
  serverId: string;
  serverName: string;
  success: boolean;
  error?: string;
  vmCount: number;
  vms: DiscoveredVmDto[];
}

@Injectable()
export class VmwareDiscoveryService {
  private readonly logger = new Logger(VmwareDiscoveryService.name);

  constructor(
    private readonly vmwareService: VmwareService,
    private readonly discoveryGateway: VmwareDiscoveryGateway,
  ) {}

  async discoverVmsFromServers(
    servers: Server[],
    sessionId: string,
  ): Promise<DiscoveryResultsDto> {
    this.logger.log(
      `Starting VM discovery for ${servers.length} servers (session: ${sessionId})`,
    );

    const vmwareServers = this.filterVmwareServers(servers);

    if (vmwareServers.length === 0) {
      this.logger.warn('No VMware servers found in the provided list');
      return this.createEmptyResults();
    }

    this.emitProgress(sessionId, {
      status: DiscoveryStatus.STARTING,
      totalServers: vmwareServers.length,
      serversProcessed: 0,
      progress: 0,
    });

    const serverResults: ServerDiscoveryResult[] = [];
    let allDiscoveredVms: DiscoveredVmDto[] = [];

    for (let i = 0; i < vmwareServers.length; i++) {
      const server = vmwareServers[i];

      this.emitProgress(sessionId, {
        status: DiscoveryStatus.DISCOVERING,
        currentServer: server.name,
        progress: (i / vmwareServers.length) * 100,
        serversProcessed: i,
        totalServers: vmwareServers.length,
      });

      const result = await this.discoverVmsFromServer(server);
      serverResults.push(result);

      if (result.success) {
        allDiscoveredVms = [...allDiscoveredVms, ...result.vms];
      }

      this.emitProgress(sessionId, {
        status: result.success
          ? DiscoveryStatus.COMPLETED
          : DiscoveryStatus.ERROR,
        currentServer: server.name,
        progress: ((i + 1) / vmwareServers.length) * 100,
        serversProcessed: i + 1,
        totalServers: vmwareServers.length,
        discoveredVms: result.vmCount,
        error: result.error,
      });

      this.logger.log(
        `Server ${server.name}: ${result.success ? 'success' : 'failed'} - ${result.vmCount} VMs`,
      );
    }

    const finalResults: DiscoveryResultsDto = {
      totalVmsDiscovered: allDiscoveredVms.length,
      totalServersProcessed: vmwareServers.length,
      successfulServers: serverResults.filter((r) => r.success).length,
      failedServers: serverResults.filter((r) => !r.success).length,
      serverResults,
      allDiscoveredVms,
    };

    this.discoveryGateway.emitDiscoveryComplete(sessionId, finalResults);
    this.logger.log(
      `Discovery completed: ${finalResults.totalVmsDiscovered} VMs found from ${finalResults.successfulServers}/${finalResults.totalServersProcessed} servers`,
    );

    return finalResults;
  }

  async discoverVmsFromServer(server: Server): Promise<ServerDiscoveryResult> {
    const result: ServerDiscoveryResult = {
      serverId: server.id,
      serverName: server.name,
      success: false,
      vmCount: 0,
      vms: [],
    };

    try {
      this.logger.debug(
        `Discovering VMs from server: ${server.name} (${server.ip})`,
      );

      const connection = this.buildVmwareConnection(server);
      const vmwareVms = await this.vmwareService.listVMs(connection);

      result.vms = vmwareVms.map((vm) => this.mapToDiscoveredVm(vm, server));
      result.vmCount = result.vms.length;
      result.success = true;

      this.logger.debug(
        `Successfully discovered ${result.vmCount} VMs from ${server.name}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      result.error = errorMessage;
      result.success = false;

      this.logger.error(
        `Failed to discover VMs from server ${server.name}:`,
        error,
      );
    }

    return result;
  }

  private filterVmwareServers(servers: Server[]): Server[] {
    return servers.filter(
      (server) =>
        server.type === 'vmware' ||
        server.type === 'vcenter' ||
        server.type === 'esxi',
    );
  }

  private buildVmwareConnection(server: Server): VmwareConnectionDto {
    return {
      host: server.ip,
      user: server.login,
      password: server.password,
      port: 443, // Default VMware port
    };
  }

  private mapToDiscoveredVm(vmwareVm: any, server: Server): DiscoveredVmDto {
    return {
      moid: vmwareVm.moid,
      name: vmwareVm.name,
      ip: vmwareVm.ipAddress,
      guestOs: vmwareVm.guestOS,
      powerState: vmwareVm.powerState,
      memoryMB: vmwareVm.memoryMB,
      numCpu: vmwareVm.numCpu,
      serverId: server.id,
      serverName: server.name,
    };
  }

  private emitProgress(
    sessionId: string,
    progress: Partial<DiscoveryProgressDto>,
  ): void {
    const progressDto: DiscoveryProgressDto = {
      status: progress.status ?? DiscoveryStatus.DISCOVERING,
      currentServer: progress.currentServer,
      progress: progress.progress,
      serversProcessed: progress.serversProcessed,
      totalServers: progress.totalServers,
      discoveredVms: progress.discoveredVms,
      error: progress.error,
      timestamp: new Date(),
    };

    this.discoveryGateway.emitDiscoveryProgress(sessionId, progressDto);
  }

  private createEmptyResults(): DiscoveryResultsDto {
    return {
      totalVmsDiscovered: 0,
      totalServersProcessed: 0,
      successfulServers: 0,
      failedServers: 0,
      serverResults: [],
      allDiscoveredVms: [],
    };
  }
}
