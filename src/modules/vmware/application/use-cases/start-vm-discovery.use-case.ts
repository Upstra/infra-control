import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { VmwareDiscoveryService } from '../../domain/services/vmware-discovery.service';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../servers/domain/entities/server.entity';

export interface StartVMDiscoveryCommand {
  readonly serverIds?: number[];
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
    vmwareServers.forEach((server) => {
      this.logger.debug(
        `Server ${server.name}: password exists = ${!!server.password}`,
      );
    });

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
