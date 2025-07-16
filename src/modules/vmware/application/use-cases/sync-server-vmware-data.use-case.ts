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

  async execute(connection: VmwareConnectionDto): Promise<{
    synchronized: number;
    discovered: VmwareServer[];
    notFound: string[];
  }> {
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
