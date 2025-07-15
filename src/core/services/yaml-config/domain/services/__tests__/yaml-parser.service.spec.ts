import { Test, TestingModule } from '@nestjs/testing';
import * as yaml from 'js-yaml';
import { MigrationPlanConfig } from '../../interfaces/yaml-config.interface';
import { YamlParserService } from '../yaml-parser.service';

jest.mock('js-yaml');

describe('YamlParserService', () => {
  let service: YamlParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YamlParserService],
    }).compile();

    service = module.get<YamlParserService>(YamlParserService);
    jest.clearAllMocks();
  });

  describe('generateYaml', () => {
    it('should generate YAML from config object', () => {
      const config: MigrationPlanConfig = {
        vCenter: {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        },
        servers: [],
      };

      const expectedYaml = 'generated-yaml-content';
      (yaml.dump as jest.Mock).mockReturnValue(expectedYaml);

      const result = service.generateYaml(config);

      expect(yaml.dump).toHaveBeenCalledWith(config, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
      expect(result).toBe(expectedYaml);
    });
  });

  describe('parseYaml', () => {
    it('should parse YAML content to config object', () => {
      const yamlContent = 'yaml-content';
      const expectedConfig: MigrationPlanConfig = {
        vCenter: {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        },
        servers: [],
      };

      (yaml.load as jest.Mock).mockReturnValue(expectedConfig);

      const result = service.parseYaml(yamlContent);

      expect(yaml.load).toHaveBeenCalledWith(yamlContent);
      expect(result).toEqual(expectedConfig);
    });
  });
});
