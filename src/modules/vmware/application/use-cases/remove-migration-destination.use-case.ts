import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

@Injectable()
export class RemoveMigrationDestinationUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    @InjectRepository(Ilo)
    private readonly iloRepository: Repository<Ilo>,
    private readonly yamlConfigService: YamlConfigService,
  ) {}

  async execute(sourceServerId: string): Promise<void> {
    const sourceServer = await this.serverRepository.findOne({
      where: { id: sourceServerId, type: 'esxi' },
    });

    if (!sourceServer) {
      throw new NotFoundException('Source server not found');
    }

    // Récupérer le serveur vCenter
    const vCenterServer = await this.serverRepository.findOne({
      where: { type: 'vcenter' },
    });

    if (!vCenterServer) {
      throw new NotFoundException('vCenter server not found in database');
    }

    // Récupérer tous les serveurs ESXi
    const allServers = await this.serverRepository.find({
      where: { type: 'esxi' },
      order: { priority: 'ASC' },
    });

    // Récupérer les VMs
    const vms = await this.vmRepository.find({
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    // Récupérer les iLOs
    const ilos = await this.iloRepository.find();
    const iloMap = new Map(ilos.map(ilo => [ilo.id, ilo]));

    const vCenterConfig = {
      ip: vCenterServer.ip,
      user: vCenterServer.login,
      password: vCenterServer.password,
    };

    // Créer une destination map vide (pas de destinations)
    const destinationMap = new Map<string, Server>();

    // Générer le fichier YAML sans destinations
    const yamlContent = await this.yamlConfigService.generateMigrationPlan(
      allServers,
      vms,
      iloMap,
      vCenterConfig,
      destinationMap,
    );

    await this.yamlConfigService.writeMigrationPlan('migration.yml', yamlContent);
  }
}