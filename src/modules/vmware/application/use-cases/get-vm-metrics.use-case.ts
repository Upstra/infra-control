import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareVmMetrics } from '@/modules/vmware/domain/interfaces';

@Injectable()
export class GetVmMetricsUseCase {
  constructor(
    private readonly vmwareService: VmwareService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(
    serverId: string,
    moid: string,
    force = false,
  ): Promise<VmwareVmMetrics> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    const connection = {
      host: server.ip,
      user: server.login,
      password: server.password,
      port: 443,
    };

    return await this.vmwareService.getVMMetrics(moid, connection, force);
  }
}
