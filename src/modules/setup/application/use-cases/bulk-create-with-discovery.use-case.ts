import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BulkCreateUseCase } from './bulk-create.use-case';
import { VmwareDiscoveryService } from '../../../vmware/domain/services/vmware-discovery.service';
import { VmwareService } from '../../../vmware/domain/services/vmware.service';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { BulkCreateRequestDto } from '../dto';
import { Server } from '../../../servers/domain/entities/server.entity';

export interface BulkCreateWithDiscoveryRequestDto
  extends BulkCreateRequestDto {
  enableDiscovery?: boolean;
  discoverySessionId?: string;
}

export interface BulkCreateWithDiscoveryResponseDto {
  success: boolean;
  created: {
    rooms: Array<{ id: string; name: string; tempId?: string }>;
    upsList: Array<{ id: string; name: string; tempId?: string }>;
    servers: Array<{ id: string; name: string; tempId?: string }>;
  };
  idMapping: {
    rooms: Record<string, string>;
    ups: Record<string, string>;
  };
  discoverySessionId?: string;
  discoveryTriggered?: boolean;
  vmwareServerCount?: number;
}

@Injectable()
export class BulkCreateWithDiscoveryUseCase {
  private readonly logger = new Logger(BulkCreateWithDiscoveryUseCase.name);

  constructor(
    private readonly bulkCreateUseCase: BulkCreateUseCase,
    private readonly vmwareDiscoveryService: VmwareDiscoveryService,
    private readonly vmwareService: VmwareService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(
    dto: BulkCreateWithDiscoveryRequestDto,
  ): Promise<BulkCreateWithDiscoveryResponseDto> {
    this.logger.log('Starting bulk create with discovery process');

    const bulkCreateResult = await this.bulkCreateUseCase.execute(dto);

    if (!bulkCreateResult.success) {
      return {
        ...bulkCreateResult,
        discoveryTriggered: false,
      };
    }

    const shouldRunDiscovery =
      dto.enableDiscovery ?? this.hasVmwareServers(dto);

    if (!shouldRunDiscovery) {
      this.logger.log(
        'No VMware servers detected or discovery disabled, skipping discovery phase',
      );
      return {
        ...bulkCreateResult,
        discoveryTriggered: false,
      };
    }

    const sessionId = dto.discoverySessionId ?? randomUUID();
    const createdServerIds = bulkCreateResult.created.servers.map((s) => s.id);

    const vmwareServers = await this.getVmwareServersFromIds(createdServerIds);

    if (vmwareServers.length === 0) {
      this.logger.log('No VMware servers found among created servers');
      return {
        ...bulkCreateResult,
        discoverySessionId: sessionId,
        discoveryTriggered: false,
        vmwareServerCount: 0,
      };
    }

    const vCenterServers = vmwareServers.filter(
      (server) => server.type?.toLowerCase() === 'vcenter',
    );
    const esxiServers = vmwareServers.filter(
      (server) => server.type?.toLowerCase() === 'esxi',
    );

    if (vCenterServers.length === 0) {
      this.logger.warn(
        'No vCenter server found, falling back to ESXi discovery',
      );
      this.vmwareDiscoveryService
        .discoverVmsFromServers(esxiServers, sessionId)
        .then((results) => {
          this.logger.log(
            `Discovery completed: ${results.totalVmsDiscovered} VMs discovered`,
          );
        })
        .catch((error) => {
          this.logger.error('Discovery failed:', error);
        });
    } else {
      const vCenter = vCenterServers[0];
      this.logger.log(
        `Starting VM discovery from vCenter ${vCenter.name} for ${esxiServers.length} ESXi servers`,
      );

      await this.updateServerMoidsFromVCenter(vCenter, esxiServers);
      this.vmwareDiscoveryService
        .discoverVmsFromVCenter(vCenter, esxiServers, sessionId)
        .then((results) => {
          this.logger.log(
            `Discovery completed: ${results.totalVmsDiscovered} VMs discovered from vCenter`,
          );
        })
        .catch((error) => {
          this.logger.error('Discovery from vCenter failed:', error);
        });
    }

    return {
      ...bulkCreateResult,
      discoverySessionId: sessionId,
      discoveryTriggered: true,
      vmwareServerCount: vmwareServers.length,
    };
  }

  private hasVmwareServers(dto: BulkCreateRequestDto): boolean {
    return dto.servers.some((server) =>
      ['vcenter', 'esxi'].includes(server.type?.toLowerCase()),
    );
  }

  private async getVmwareServersFromIds(
    serverIds: string[],
  ): Promise<Server[]> {
    const vmwareServers: Server[] = [];

    for (const id of serverIds) {
      const server =
        await this.serverRepository.findServerByIdWithCredentials(id);
      if (server && ['vcenter', 'esxi'].includes(server.type?.toLowerCase())) {
        vmwareServers.push(server);
      }
    }

    return vmwareServers;
  }

  private async updateServerMoidsFromVCenter(
    vCenter: Server,
    esxiServers: Server[],
  ): Promise<void> {
    this.logger.log(`Updating server MOIDs from vCenter ${vCenter.name}`);

    try {
      const connection = {
        host: vCenter.ip,
        user: vCenter.login,
        password: vCenter.password,
        port: 443,
      };

      const discoveredServers =
        await this.vmwareService.listServers(connection);

      this.logger.log(
        `vCenter returned ${discoveredServers.length} servers with MOIDs`,
      );

      const esxiByIp = new Map<string, Server>();
      esxiServers.forEach((server) => {
        esxiByIp.set(server.ip, server);
      });

      for (const discoveredServer of discoveredServers) {
        const esxiServer = esxiByIp.get(discoveredServer.ip);
        if (esxiServer && discoveredServer.moid) {
          this.logger.debug(
            `Updating MOID for server ${esxiServer.name}: ${discoveredServer.moid}`,
          );
          await this.serverRepository.updateServer(esxiServer.id, {
            vmwareHostMoid: discoveredServer.moid,
          });
          esxiServer.vmwareHostMoid = discoveredServer.moid;
        }
      }

      this.logger.log('Server MOIDs updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update server MOIDs from vCenter:`, error);
      throw error;
    }
  }
}
