import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YamlConfigService } from './application/yaml-config.service';
import { YamlParserService } from './domain/services/yaml-parser.service';
import { MigrationPlanBuilderService } from './domain/services/migration-plan-builder.service';
import { YamlFileRepository } from './infrastructure/yaml-file.repository';

@Module({
  imports: [ConfigModule],
  providers: [
    YamlConfigService,
    YamlParserService,
    MigrationPlanBuilderService,
    YamlFileRepository,
  ],
  exports: [YamlConfigService],
})
export class YamlConfigModule {}