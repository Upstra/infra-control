import { Injectable, Logger, Inject } from '@nestjs/common';
import { VmwareService } from './vmware.service';
import { VmwareDiscoveryGateway } from '../../application/gateway/vmware-discovery.gateway';
import { Server } from '../../../servers/domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import {
  DiscoveryProgressDto,
  DiscoveryResultsDto,
  DiscoveredVmDto,
  DiscoveryStatus,
} from '../../application/dto';
import { VmwareConnectionDto } from '../../application/dto/vmware-connection.dto';
import { SaveDiscoveredVmsUseCase } from '../../application/use-cases/save-discovered-vms.use-case';
import { DiscoverySessionService } from './discovery-session.service';

export interface ServerDiscoveryResult {
  serverId: string;
  serverName: string;
  success: boolean;
  error?: string;
  vmCount: number;
  vms: DiscoveredVmDto[];
  hostMoid?: string;
}

@Injectable()
export class VmwareDiscoveryService {
  private readonly logger = new Logger(VmwareDiscoveryService.name);

  constructor(
    private readonly vmwareService: VmwareService,
    private readonly discoveryGateway: VmwareDiscoveryGateway,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly saveDiscoveredVmsUseCase: SaveDiscoveredVmsUseCase,
    private readonly discoverySessionService: DiscoverySessionService,
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
      this.logger.warn(
        'Provided servers:',
        servers.map((s) => ({ name: s.name, type: s.type })),
      );
      this.logger.warn('Supported types: vmware, esxi, vcenter');
      return this.createEmptyResults();
    }

    await this.discoverySessionService.createSession(
      sessionId,
      vmwareServers.length,
    );

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

      const progressData = {
        status: DiscoveryStatus.DISCOVERING,
        currentServer: server.name,
        progress: (i / vmwareServers.length) * 100,
        serversProcessed: i,
        totalServers: vmwareServers.length,
      };

      await this.discoverySessionService.updateSession(sessionId, progressData);

      this.emitProgress(sessionId, progressData);

      const result = await this.discoverVmsFromServer(server);
      serverResults.push(result);

      if (result.success) {
        allDiscoveredVms = [...allDiscoveredVms, ...result.vms];
      }

      const updateData = {
        progress: ((i + 1) / vmwareServers.length) * 100,
        serversProcessed: i + 1,
        successfulServers: serverResults.filter((r) => r.success).length,
        failedServers: serverResults.filter((r) => !r.success).length,
        totalVmsDiscovered: allDiscoveredVms.length,
        serverResults,
        failedServerIds: serverResults
          .filter((r) => !r.success)
          .map((r) => r.serverId),
      };

      await this.discoverySessionService.updateSession(sessionId, updateData);

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

    if (allDiscoveredVms.length > 0) {
      this.logger.log('Saving discovered VMs to database...');

      this.logger.log(`Discovered ${allDiscoveredVms.length} VMs to save:`);
      allDiscoveredVms.forEach((vm, index) => {
        this.logger.log(`VM ${index + 1}/${allDiscoveredVms.length}:`);
        this.logger.log(`  - Name: ${vm.name}`);
        this.logger.log(`  - MOID: ${vm.moid}`);
        this.logger.log(`  - Server ID: ${vm.serverId}`);
        this.logger.log(`  - Server Name: ${vm.serverName}`);
        this.logger.log(`  - IP: ${vm.ip || 'N/A'}`);
        this.logger.log(`  - Power State: ${vm.powerState || 'N/A'}`);
        this.logger.log(`  - Guest OS: ${vm.guestOs || 'N/A'}`);
      });

      try {
        const saveResult =
          await this.saveDiscoveredVmsUseCase.execute(allDiscoveredVms);
        this.logger.log(
          `Saved ${saveResult.savedCount} VMs to database (${saveResult.failedCount} failed)`,
        );

        if (saveResult.errors.length > 0) {
          this.logger.warn('Some VMs failed to save:', saveResult.errors);
        }
      } catch (error) {
        this.logger.error('Failed to save discovered VMs:', error);
      }
    }

    await this.discoverySessionService.completeSession(sessionId, {
      totalVmsDiscovered: finalResults.totalVmsDiscovered,
      serversProcessed: finalResults.totalServersProcessed,
      successfulServers: finalResults.successfulServers,
      failedServers: finalResults.failedServers,
      serverResults: finalResults.serverResults,
      failedServerIds: serverResults
        .filter((r) => !r.success)
        .map((r) => r.serverId),
    });

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
    return servers.filter((server) => server.type === 'esxi');
  }

  private buildVmwareConnection(server: Server): VmwareConnectionDto {
    this.logger.debug(`Building connection for server ${server.name}:`);
    this.logger.debug(`- IP: ${server.ip}`);
    this.logger.debug(`- Login: ${server.login}`);
    this.logger.debug(`- Password exists: ${!!server.password}`);
    this.logger.debug(`- Password length: ${server.password?.length ?? 0}`);

    return {
      host: server.ip,
      user: server.login,
      password: server.password,
      port: 443,
    };
  }

  private mapToDiscoveredVm(vmwareVm: any, server: Server): DiscoveredVmDto {
    return {
      moid: vmwareVm.moid,
      name: vmwareVm.name,
      ip: vmwareVm.ip,
      guestOs: vmwareVm.guestOs,
      powerState: vmwareVm.powerState,
      memoryMB: vmwareVm.memoryMB,
      numCpu: vmwareVm.numCPU,
      serverId: server.id,
      serverName: server.name,
      esxiHostMoid: vmwareVm.esxiHostMoid,
    };
  }

  private async updateServerHostMoid(
    serverId: string,
    hostMoid: string,
  ): Promise<void> {
    try {
      await this.serverRepository.updateServer(serverId, {
        vmwareHostMoid: hostMoid,
      });
      this.logger.log(
        `Updated server ${serverId} with vmwareHostMoid: ${hostMoid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update server ${serverId} with host moid:`,
        error,
      );
    }
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

  async discoverVmsFromVCenter(
    vCenterServer: Server,
    esxiServers: Server[],
    sessionId: string,
  ): Promise<DiscoveryResultsDto> {
    this.logger.log(
      `Starting VM discovery from vCenter ${vCenterServer.name} (session: ${sessionId})`,
    );

    await this.discoverySessionService.createSession(sessionId, 1);

    this.emitProgress(sessionId, {
      status: DiscoveryStatus.STARTING,
      totalServers: 1,
      serversProcessed: 0,
      progress: 0,
    });

    const result: ServerDiscoveryResult = {
      serverId: vCenterServer.id,
      serverName: vCenterServer.name,
      success: false,
      vmCount: 0,
      vms: [],
    };

    try {
      this.emitProgress(sessionId, {
        status: DiscoveryStatus.DISCOVERING,
        currentServer: vCenterServer.name,
        progress: 10,
        serversProcessed: 0,
        totalServers: 1,
      });

      const connection = this.buildVmwareConnection(vCenterServer);
      const allVms = await this.vmwareService.listVMs(connection);
      this.logger.log(`vCenter returned ${allVms.length} VMs total`);

      const esxiServerMap = new Map<string, Server>();
      esxiServers.forEach((server) => {
        if (server.vmwareHostMoid) {
          esxiServerMap.set(server.vmwareHostMoid, server);
        }
      });

      this.logger.debug(
        `ESXi server map contains ${esxiServerMap.size} servers with MOIDs`,
      );

      const discoveredVms: DiscoveredVmDto[] = [];
      const orphanVms: any[] = [];

      allVms.forEach((vm) => {
        const esxiServer = esxiServerMap.get(vm.esxiHostMoid);
        if (esxiServer) {
          discoveredVms.push(this.mapToDiscoveredVm(vm, esxiServer));
        } else {
          orphanVms.push(vm);
          this.logger.warn(
            `VM ${vm.name} has esxiHostMoid ${vm.esxiHostMoid} which doesn't match any discovered ESXi server`,
          );
        }
      });

      if (orphanVms.length > 0) {
        this.logger.warn(
          `Found ${orphanVms.length} VMs without matching ESXi servers`,
        );
      }

      result.vms = discoveredVms;
      result.vmCount = discoveredVms.length;
      result.success = true;

      this.emitProgress(sessionId, {
        status: DiscoveryStatus.COMPLETED,
        currentServer: vCenterServer.name,
        progress: 90,
        serversProcessed: 1,
        totalServers: 1,
        discoveredVms: result.vmCount,
      });

      if (discoveredVms.length > 0) {
        this.logger.log(
          `Saving ${discoveredVms.length} discovered VMs to database...`,
        );

        const saveResult =
          await this.saveDiscoveredVmsUseCase.execute(discoveredVms);
        this.logger.log(
          `Saved ${saveResult.savedCount} VMs to database (${saveResult.failedCount} failed)`,
        );

        if (saveResult.errors.length > 0) {
          this.logger.warn('Some VMs failed to save:', saveResult.errors);
        }
      }

      const finalResults: DiscoveryResultsDto = {
        totalVmsDiscovered: result.vmCount,
        totalServersProcessed: 1,
        successfulServers: 1,
        failedServers: 0,
        serverResults: [result],
        allDiscoveredVms: result.vms,
      };

      await this.discoverySessionService.completeSession(sessionId, {
        totalVmsDiscovered: finalResults.totalVmsDiscovered,
        serversProcessed: 1,
        successfulServers: 1,
        failedServers: 0,
        serverResults: [result],
        failedServerIds: [],
      });

      this.discoveryGateway.emitDiscoveryComplete(sessionId, finalResults);

      return finalResults;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      result.error = errorMessage;
      result.success = false;

      this.logger.error(
        `Failed to discover VMs from vCenter ${vCenterServer.name}:`,
        error,
      );

      this.emitProgress(sessionId, {
        status: DiscoveryStatus.ERROR,
        currentServer: vCenterServer.name,
        progress: 100,
        serversProcessed: 1,
        totalServers: 1,
        error: errorMessage,
      });

      const finalResults: DiscoveryResultsDto = {
        totalVmsDiscovered: 0,
        totalServersProcessed: 1,
        successfulServers: 0,
        failedServers: 1,
        serverResults: [result],
        allDiscoveredVms: [],
      };

      await this.discoverySessionService.completeSession(sessionId, {
        totalVmsDiscovered: 0,
        serversProcessed: 1,
        successfulServers: 0,
        failedServers: 1,
        serverResults: [result],
        failedServerIds: [vCenterServer.id],
      });

      this.discoveryGateway.emitDiscoveryComplete(sessionId, finalResults);

      return finalResults;
    }
  }
}
