import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwareService } from '../../domain/services/vmware.service';
import { VmwareConnectionDto } from '../dto';
import { VmwareServer } from '../../domain/interfaces';

@Injectable()
export class SyncServerVmwareDataUseCase {
  constructor(
    private readonly vmwareService: VmwareService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(
    params: { serverId?: string; fullSync?: boolean } | VmwareConnectionDto,
  ): Promise<{
    synchronized?: number;
    discovered?: VmwareServer[];
    notFound?: string[];
    serverId?: string;
    vmsUpdated?: number;
    vmsAdded?: number;
    vmsRemoved?: number;
    errors?: string[];
  }> {
    // TODO: Implement server-specific sync for new params structure
    if ('serverId' in params || 'fullSync' in params) {
      return {
        serverId: 'serverId' in params ? params.serverId : undefined,
        vmsUpdated: 0,
        vmsAdded: 0,
        vmsRemoved: 0,
        errors: [],
      };
    }

    const connection = params as VmwareConnectionDto;
    const discoveredServers = await this.vmwareService.listServers(connection);
    const existingServers = await this.serverRepository.find();

    let synchronized = 0;
    const notFound: string[] = [];

    for (const existingServer of existingServers) {
      const discoveredServer = discoveredServers.find(
        (ds) => ds.moid === existingServer.vmwareHostMoid,
      );

      if (discoveredServer) {
        await this.serverRepository.update(existingServer.id, {
          vmwareVCenterIp:
            discoveredServer.vCenterIp || existingServer.vmwareVCenterIp,
          vmwareCluster:
            discoveredServer.cluster || existingServer.vmwareCluster,
          vmwareVendor: discoveredServer.vendor || existingServer.vmwareVendor,
          vmwareModel: discoveredServer.model || existingServer.vmwareModel,
          vmwareCpuCores:
            discoveredServer.cpuCores || existingServer.vmwareCpuCores,
          vmwareCpuThreads:
            discoveredServer.cpuThreads || existingServer.vmwareCpuThreads,
          vmwareCpuMHz: discoveredServer.cpuMHz || existingServer.vmwareCpuMHz,
          vmwareRamTotal:
            discoveredServer.ramTotal || existingServer.vmwareRamTotal,
        });
        synchronized++;
      } else {
        notFound.push(existingServer.name);
      }
    }

    return {
      synchronized,
      discovered: discoveredServers,
      notFound,
    };
  }
}
