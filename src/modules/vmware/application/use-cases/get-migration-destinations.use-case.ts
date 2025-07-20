import { Injectable } from '@nestjs/common';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';
import { MigrationDestinationResponseDto } from '../dto/migration-destination.dto';

@Injectable()
export class GetMigrationDestinationsUseCase {
  constructor(private readonly yamlConfigService: YamlConfigService) {}

  async execute(): Promise<{
    destinations: MigrationDestinationResponseDto[];
    yamlPath: string;
  }> {
    try {
      const migrationPlan =
        await this.yamlConfigService.readMigrationPlan('migration.yml');

      const destinations: MigrationDestinationResponseDto[] = [];
      for (const serverConfig of migrationPlan.servers) {
        const sourceServer = {
          id: '',
          name: serverConfig.server.host.name,
          vmwareHostMoid: serverConfig.server.host.moid,
        };

        const destinationInfo: MigrationDestinationResponseDto = {
          sourceServer,
        };

        if (serverConfig.server.destination) {
          destinationInfo.destinationServer = {
            id: '',
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
    } catch {
      return {
        destinations: [],
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      };
    }
  }
}
