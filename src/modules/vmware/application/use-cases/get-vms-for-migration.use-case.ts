import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import {
  VmsForMigrationResponseDto,
  ServerVmsDto,
} from '../dto/migration-destination.dto';

@Injectable()
export class GetVmsForMigrationUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
  ) {}

  async execute(): Promise<VmsForMigrationResponseDto> {
    const esxiServers = await this.serverRepository.find({
      where: { type: 'esxi' },
      order: { priority: 'ASC', name: 'ASC' },
    });

    const serverIds = esxiServers.map((server) => server.id);

    const vms = await this.vmRepository.find({
      where: serverIds.map((serverId) => ({ serverId })),
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    const vmsByServer = new Map<string, Vm[]>();
    vms.forEach((vm) => {
      if (!vmsByServer.has(vm.serverId)) {
        vmsByServer.set(vm.serverId, []);
      }
      vmsByServer.get(vm.serverId)!.push(vm);
    });

    const servers: ServerVmsDto[] = esxiServers.map((server) => {
      const serverVms = vmsByServer.get(server.id) || [];

      return {
        server: {
          id: server.id,
          name: server.name,
          vmwareHostMoid: server.vmwareHostMoid || '',
        },
        vms: serverVms.map((vm) => ({
          id: vm.id,
          name: vm.name,
          moid: vm.moid,
          state: vm.state,
          priority: vm.priority,
          grace_period_on: vm.grace_period_on,
          grace_period_off: vm.grace_period_off,
        })),
      };
    });

    const totalVms = vms.length;

    return {
      servers,
      totalServers: esxiServers.length,
      totalVms,
    };
  }
}
