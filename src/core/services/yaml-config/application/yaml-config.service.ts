import { Injectable, Logger } from '@nestjs/common';
import { Server } from '../../../../modules/servers/domain/entities/server.entity';
import { Vm } from '../../../../modules/vms/domain/entities/vm.entity';
import { Ilo } from '../../../../modules/ilos/domain/entities/ilo.entity';
import {
  IYamlConfigService,
  MigrationPlanConfig,
  VCenterConfig,
  UpsConfig,
} from '../domain/interfaces/yaml-config.interface';
import { YamlParserService } from '../domain/services/yaml-parser.service';
import { MigrationPlanBuilderService } from '../domain/services/migration-plan-builder.service';
import { YamlFileRepository } from '../infrastructure/yaml-file.repository';

@Injectable()
export class YamlConfigService implements IYamlConfigService {
  private readonly logger = new Logger(YamlConfigService.name);

  constructor(
    private readonly yamlParser: YamlParserService,
    private readonly planBuilder: MigrationPlanBuilderService,
    private readonly fileRepository: YamlFileRepository,
  ) {}

  async generateMigrationPlan(
    servers: Server[],
    vms: Vm[],
    ilos: Map<
      string,
      Ilo | { id: string; ip: string; login: string; password: string }
    >,
    vCenterConfig: { ip: string; user: string; password: string },
    upsConfig: UpsConfig,
    destinationServers?: Map<string, Server>,
  ): Promise<string> {
    const config: VCenterConfig = {
      ...vCenterConfig,
      port: 443,
    };

    this.logger.debug(
      `Generating migration plan with vcenter config: ${JSON.stringify(config)} with a password length of ${vCenterConfig.password?.length ?? 0}`,
    );

    const migrationPlan = this.planBuilder.buildMigrationPlan(
      servers,
      vms,
      ilos,
      config,
      upsConfig,
      destinationServers,
    );

    return this.generateMigrationPlanContent(migrationPlan);
  }

  generateMigrationPlanContent(config: MigrationPlanConfig): string {
    this.logger.debug(
      `Generating migration plan content with Vcenter config: ${JSON.stringify(config.vCenter)}`,
    );
    return this.yamlParser.generateYaml(config);
  }

  parseMigrationPlanContent(content: string): MigrationPlanConfig {
    return this.yamlParser.parseYaml(content);
  }

  async writeMigrationPlan(filename: string, content: string): Promise<string> {
    return this.fileRepository.write(filename, content);
  }

  async readMigrationPlan(filename: string): Promise<MigrationPlanConfig> {
    const content = await this.fileRepository.read(filename);
    return this.parseMigrationPlanContent(content);
  }

  async deleteMigrationPlan(filename: string): Promise<void> {
    return this.fileRepository.delete(filename);
  }

  async listMigrationPlans(): Promise<string[]> {
    return this.fileRepository.list();
  }
}
