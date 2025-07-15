import { Injectable, NotFoundException } from '@nestjs/common';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';
import { MigrationDestinationResponseDto } from '../dto/migration-destination.dto';

@Injectable()
export class GetMigrationDestinationsUseCase {
  constructor(
    private readonly yamlConfigService: YamlConfigService,
  ) {}

  async execute(): Promise<{ destinations: MigrationDestinationResponseDto[]; yamlPath: string }> {
    try {
      // Lire le fichier YAML actuel
      const migrationPlan = await this.yamlConfigService.readMigrationPlan('migration.yml');
      
      const destinations: MigrationDestinationResponseDto[] = [];
      
      // Parcourir les serveurs dans le plan YAML
      for (const serverConfig of migrationPlan.servers) {
        const sourceServer = {
          id: '', // Le YAML ne contient pas l'ID, seulement le MOID
          name: serverConfig.server.host.name,
          vmwareHostMoid: serverConfig.server.host.moid,
        };

        const destinationInfo: MigrationDestinationResponseDto = {
          sourceServer,
        };

        // Si le serveur a une destination configurée
        if (serverConfig.server.destination) {
          destinationInfo.destinationServer = {
            id: '', // Le YAML ne contient pas l'ID, seulement le MOID
            name: serverConfig.server.destination.name,
            vmwareHostMoid: serverConfig.server.destination.moid,
          };
        }

        destinations.push(destinationInfo);
      }

      return {
        destinations,
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      };
    } catch (error) {
      // Si le fichier n'existe pas, retourner une liste vide
      return {
        destinations: [],
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      };
    }
  }
}