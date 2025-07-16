import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';
import { UpsConfig } from '@/core/services/yaml-config/domain/interfaces/yaml-config.interface';

@Injectable()
export class GenerateMigrationPlanUseCase {
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

  async execute(): Promise<void> {
    const vCenterServer = await this.serverRepository
      .createQueryBuilder('server')
      .addSelect('server.password')
      .where('server.type = :type', { type: 'vcenter' })
      .getOne();

    if (!vCenterServer) {
      throw new NotFoundException('vCenter server not found in database');
    }

    const servers = await this.serverRepository.find({
      where: { type: 'esxi' },
      order: { priority: 'ASC' },
      relations: ['ups'],
    });

    const vms = await this.vmRepository.find({
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    const ilos = await this.iloRepository.find();
    const iloMap = new Map(ilos.map((ilo) => [ilo.id, ilo]));

    const vCenterConfig = {
      ip: vCenterServer.ip,
      user: vCenterServer.login,
      password: vCenterServer.password,
    };

    const serverWithUps = servers.find((server) => server.ups);
    if (!serverWithUps || !serverWithUps.ups) {
      throw new NotFoundException(
        'No UPS found for the servers. A UPS is required for migration planning.',
      );
    }

    const upsConfig: UpsConfig = {
      shutdownGrace: serverWithUps.ups.grace_period_off,
      restartGrace: serverWithUps.ups.grace_period_on,
    };

    const yamlContent = await this.yamlConfigService.generateMigrationPlan(
      servers,
      vms,
      iloMap,
      vCenterConfig,
      upsConfig,
    );

    const filename = 'migration.yml';
    await this.yamlConfigService.writeMigrationPlan(filename, yamlContent);
  }
}
