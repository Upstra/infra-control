import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

@Injectable()
export class GenerateMigrationPlanUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    @InjectRepository(Ilo)
    private readonly iloRepository: Repository<Ilo>,
    private readonly yamlConfigService: YamlConfigService,
  ) {}

  async execute(): Promise<void> {
    const vCenterServer = await this.serverRepository.findOne({
      where: { type: 'vcenter' },
    });

    if (!vCenterServer) {
      throw new NotFoundException('vCenter server not found in database');
    }

    const servers = await this.serverRepository.find({
      where: { type: 'esxi' },
      order: { priority: 'ASC' },
    });

    const vms = await this.vmRepository.find({
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
      servers,
      vms,
      iloMap,
      vCenterConfig,
    );

    const filename = 'migration.yml';
    await this.yamlConfigService.writeMigrationPlan(filename, yamlContent);
  }
}