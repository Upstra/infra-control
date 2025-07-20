import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';
import { UpsConfig } from '@/core/services/yaml-config/domain/interfaces/yaml-config.interface';

export interface MigrationDestination {
  sourceServerId: string;
  destinationServerId?: string;
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
    @InjectRepository(Ups)
    private readonly upsRepository: Repository<Ups>,
    private readonly yamlConfigService: YamlConfigService,
  ) {}

  async execute(destinations: MigrationDestination[]): Promise<void> {
    this.validateDestinations(destinations);

    const vCenterServer = await this.serverRepository
      .createQueryBuilder('server')
      .addSelect('server.password')
      .where('server.type = :type', { type: 'vcenter' })
      .getRawOne();

    if (!vCenterServer) {
      throw new NotFoundException('vCenter server not found in database');
    }

    if (!vCenterServer.server_password) {
      throw new NotFoundException(
        'vCenter server password not found. Please ensure the vCenter server has a password configured.',
      );
    }

    const sourceServerIds = destinations.map((d) => d.sourceServerId);
    const destinationServerIds = destinations
      .filter((d) => d.destinationServerId)
      .map((d) => d.destinationServerId!);
    const allServerIds = [
      ...new Set([...sourceServerIds, ...destinationServerIds]),
    ];

    const servers = await this.serverRepository.find({
      where: allServerIds.map((id) => ({ id })),
      relations: ['ups'],
    });
    const serverMap = new Map(servers.map((s) => [s.id, s]));

    const sourceServers = sourceServerIds
      .map((id) => serverMap.get(id))
      .filter((s): s is Server => s !== undefined && s.type === 'esxi')
      .sort((a, b) => a.priority - b.priority);

    const destinationMap = new Map<string, Server>();
    destinations.forEach(({ sourceServerId, destinationServerId }) => {
      if (destinationServerId) {
        const destServer = serverMap.get(destinationServerId);
        if (destServer && destServer.type === 'esxi') {
          destinationMap.set(sourceServerId, destServer);
        }
      }
    });

    const vms = await this.vmRepository.find({
      where: sourceServerIds.map((id) => ({ serverId: id })),
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    const ilosRaw = await this.iloRepository
      .createQueryBuilder('ilo')
      .select(['ilo.id', 'ilo.ip', 'ilo.login'])
      .addSelect('ilo.password')
      .getRawMany();

    const iloMap = new Map(
      ilosRaw.map((ilo) => [
        ilo.ilo_id,
        {
          id: ilo.ilo_id,
          ip: ilo.ilo_ip,
          login: ilo.ilo_login,
          password: ilo.ilo_password,
        },
      ]),
    );

    const vCenterConfig = {
      ip: vCenterServer.server_ip,
      user: vCenterServer.server_login,
      password: vCenterServer.server_password,
    };

    const serverWithUps = sourceServers.find((server) => server.ups);
    if (!serverWithUps || !serverWithUps.ups) {
      throw new NotFoundException(
        'No UPS found for the source servers. A UPS is required for migration planning.',
      );
    }

    const upsConfig: UpsConfig = {
      shutdownGrace: serverWithUps.ups.grace_period_off,
      restartGrace: serverWithUps.ups.grace_period_on,
    };

    const yamlContent = await this.yamlConfigService.generateMigrationPlan(
      sourceServers,
      vms,
      iloMap,
      vCenterConfig,
      upsConfig,
      destinationMap,
    );

    const filename = 'migration.yml';
    await this.yamlConfigService.writeMigrationPlan(filename, yamlContent);
  }

  private validateDestinations(destinations: MigrationDestination[]): void {
    const sourceServerIds = destinations.map((d) => d.sourceServerId);
    const uniqueSourceServerIds = new Set(sourceServerIds);

    if (sourceServerIds.length !== uniqueSourceServerIds.size) {
      throw new BadRequestException(
        'Each source server can have at most one destination',
      );
    }

    destinations.forEach(({ sourceServerId, destinationServerId }) => {
      if (destinationServerId && sourceServerId === destinationServerId) {
        throw new BadRequestException(
          'Source and destination server cannot be the same',
        );
      }
    });
  }
}
