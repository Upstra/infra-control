import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

export interface MigrationDestination {
  sourceServerId: string;
  destinationServerId: string;
}

@Injectable()
export class GenerateMigrationPlanWithDestinationUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    @InjectRepository(Ilo)
    private readonly iloRepository: Repository<Ilo>,
    private readonly yamlConfigService: YamlConfigService,
  ) {}

  async execute(destinations: MigrationDestination[]): Promise<void> {
    this.validateDestinations(destinations);

    const vCenterServer = await this.serverRepository.findOne({
      where: { type: 'vcenter' },
    });

    if (!vCenterServer) {
      throw new NotFoundException('vCenter server not found in database');
    }

    const sourceServerIds = destinations.map(d => d.sourceServerId);
    const destinationServerIds = destinations.map(d => d.destinationServerId);
    const allServerIds = [...new Set([...sourceServerIds, ...destinationServerIds])];

    const servers = await this.serverRepository.findByIds(allServerIds);
    const serverMap = new Map(servers.map(s => [s.id, s]));

    const sourceServers = sourceServerIds
      .map(id => serverMap.get(id))
      .filter((s): s is Server => s !== undefined && s.type === 'esxi')
      .sort((a, b) => a.priority - b.priority);

    const destinationMap = new Map<string, Server>();
    destinations.forEach(({ sourceServerId, destinationServerId }) => {
      const destServer = serverMap.get(destinationServerId);
      if (destServer && destServer.type === 'esxi') {
        destinationMap.set(sourceServerId, destServer);
      }
    });

    const vms = await this.vmRepository.find({
      where: sourceServerIds.map(id => ({ serverId: id })),
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    const ilos = await this.iloRepository.find();
    const iloMap = new Map(ilos.map(ilo => [ilo.id, ilo]));

    const vCenterConfig = {
      ip: vCenterServer.ip,
      user: vCenterServer.login,
      password: vCenterServer.password,
    };

    const yamlContent = await this.yamlConfigService.generateMigrationPlan(
      sourceServers,
      vms,
      iloMap,
      vCenterConfig,
      destinationMap,
    );

    const filename = 'migration.yml';
    await this.yamlConfigService.writeMigrationPlan(filename, yamlContent);
  }

  private validateDestinations(destinations: MigrationDestination[]): void {
    const sourceServerIds = destinations.map(d => d.sourceServerId);
    const uniqueSourceServerIds = new Set(sourceServerIds);

    if (sourceServerIds.length !== uniqueSourceServerIds.size) {
      throw new BadRequestException('Each source server can have at most one destination');
    }

    destinations.forEach(({ sourceServerId, destinationServerId }) => {
      if (sourceServerId === destinationServerId) {
        throw new BadRequestException('Source and destination server cannot be the same');
      }
    });
  }
}