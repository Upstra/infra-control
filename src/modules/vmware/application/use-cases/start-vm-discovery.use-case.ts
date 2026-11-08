import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { VmwareDiscoveryService } from '../../domain/services/vmware-discovery.service';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../servers/domain/entities/server.entity';

export interface StartVMDiscoveryCommand {
  readonly serverIds?: string[];
}

export interface StartVMDiscoveryResult {
  readonly sessionId: string;
  readonly serverCount: number;
}

@Injectable()
export class StartVMDiscoveryUseCase {
  private readonly logger = new Logger(StartVMDiscoveryUseCase.name);

  constructor(
    private readonly vmwareDiscoveryService: VmwareDiscoveryService,
    @Inject('ServerRepositoryInterface')
    private readonly serversRepository: ServerRepositoryInterface,
  ) {}

  async execute(
    command: StartVMDiscoveryCommand,
  ): Promise<StartVMDiscoveryResult> {
    const sessionId = randomUUID();

    let servers: Server[];

    if (command.serverIds?.length) {
      servers = [];
      for (const id of command.serverIds) {
        const server =
          await this.serversRepository.findServerByIdWithCredentials(
            id.toString(),
          );
        if (server) {
          servers.push(server);
        }
      }
    } else {
      servers = await this.serversRepository.findAllWithCredentials();
    }

    const vmwareServers = servers.filter((server) =>
      ['vmware', 'vcenter', 'esxi'].includes(server.type?.toLowerCase()),
    );

    this.logger.log(`Found ${vmwareServers.length} VMware servers`);

    // Same strategy as the setup wizard: the vCenter sees every VM of the
    // hosts it manages, so query it once instead of each ESXi directly (ESXi
    // credentials are often not set up for the VIM API, and in the demo the
    // ESXi addresses are the iLO simulators).
    const vCenter = vmwareServers.find(
      (server) => server.type?.toLowerCase() === 'vcenter',
    );
    if (vCenter) {
      const esxiServers = (
        command.serverIds?.length
          ? await this.serversRepository.findAllWithCredentials()
          : servers
      ).filter((server) => server.type?.toLowerCase() === 'esxi');

      this.vmwareDiscoveryService
        .discoverVmsFromVCenter(vCenter, esxiServers, sessionId)
        .catch((error) =>
          this.logger.error(`vCenter discovery failed: ${error?.message}`),
        );
      return { sessionId, serverCount: 1 };
    }

    this.vmwareDiscoveryService.discoverVmsFromServers(
      vmwareServers,
      sessionId,
    );

    return {
      sessionId,
      serverCount: vmwareServers.length,
    };
  }
}
