import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BulkCreateUseCase } from './bulk-create.use-case';
import { VmwareDiscoveryService } from '../../../vmware/domain/services/vmware-discovery.service';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { BulkCreateRequestDto } from '../dto';
import { Server } from '../../../servers/domain/entities/server.entity';

export interface BulkCreateWithDiscoveryRequestDto extends BulkCreateRequestDto {
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
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(
    dto: BulkCreateWithDiscoveryRequestDto,
    userId?: string,
  ): Promise<BulkCreateWithDiscoveryResponseDto> {
    this.logger.log('Starting bulk create with discovery process');

    const bulkCreateResult = await this.bulkCreateUseCase.execute(dto, userId);

    if (!bulkCreateResult.success) {
      return {
        ...bulkCreateResult,
        discoveryTriggered: false,
      };
    }

    const shouldRunDiscovery = dto.enableDiscovery ?? this.hasVmwareServers(dto);

    if (!shouldRunDiscovery) {
      this.logger.log('No VMware servers detected or discovery disabled, skipping discovery phase');
      return {
        ...bulkCreateResult,
        discoveryTriggered: false,
      };
    }

    const sessionId = dto.discoverySessionId ?? randomUUID();
    const createdServerIds = bulkCreateResult.created.servers.map(s => s.id);
    
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

    this.logger.log(`Starting discovery for ${vmwareServers.length} VMware servers`);
    
    this.vmwareDiscoveryService.discoverVmsFromServers(vmwareServers, sessionId)
      .then(results => {
        this.logger.log(`Discovery completed: ${results.totalVmsDiscovered} VMs discovered`);
      })
      .catch(error => {
        this.logger.error('Discovery failed:', error);
      });

    return {
      ...bulkCreateResult,
      discoverySessionId: sessionId,
      discoveryTriggered: true,
      vmwareServerCount: vmwareServers.length,
    };
  }

  private hasVmwareServers(dto: BulkCreateRequestDto): boolean {
    return dto.servers.some(server => 
      ['vmware', 'vcenter', 'esxi'].includes(server.type?.toLowerCase())
    );
  }

  private async getVmwareServersFromIds(serverIds: string[]): Promise<Server[]> {
    const vmwareServers: Server[] = [];

    for (const id of serverIds) {
      const server = await this.serverRepository.findServerById(id);
      if (server && ['vmware', 'vcenter', 'esxi'].includes(server.type?.toLowerCase())) {
        vmwareServers.push(server);
      }
    }

    return vmwareServers;
  }
}