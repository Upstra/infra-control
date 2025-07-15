import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { MigrationPlanConfig } from '../interfaces/yaml-config.interface';

@Injectable()
export class YamlParserService {
  generateYaml(config: MigrationPlanConfig): string {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  }

  parseYaml(content: string): MigrationPlanConfig {
    return yaml.load(content) as MigrationPlanConfig;
  }
}