import { Test, TestingModule } from '@nestjs/testing';
import { YamlConfigService } from '../yaml-config.service';
import { YamlParserService } from '../../domain/services/yaml-parser.service';
import { MigrationPlanBuilderService } from '../../domain/services/migration-plan-builder.service';
import { YamlFileRepository } from '../../infrastructure/yaml-file.repository';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { MigrationPlanConfig, UpsConfig } from '../../domain/interfaces/yaml-config.interface';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';

describe('YamlConfigService', () => {
  let service: YamlConfigService;
  let yamlParserService: YamlParserService;
  let planBuilderService: MigrationPlanBuilderService;
  let fileRepository: YamlFileRepository;

  const mockYamlParserService = {
    generateYaml: jest.fn(),
    parseYaml: jest.fn(),
  };

  const mockPlanBuilderService = {
    buildMigrationPlan: jest.fn(),
  };

  const mockFileRepository = {
    write: jest.fn(),
    read: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YamlConfigService,
        {
          provide: YamlParserService,
          useValue: mockYamlParserService,
        },
        {
          provide: MigrationPlanBuilderService,
          useValue: mockPlanBuilderService,
        },
        {
          provide: YamlFileRepository,
          useValue: mockFileRepository,
        },
      ],
    }).compile();

    service = module.get<YamlConfigService>(YamlConfigService);
    yamlParserService = module.get<YamlParserService>(YamlParserService);
    planBuilderService = module.get<MigrationPlanBuilderService>(
      MigrationPlanBuilderService,
    );
    fileRepository = module.get<YamlFileRepository>(YamlFileRepository);

    jest.clearAllMocks();
  });

  describe('generateMigrationPlan', () => {
    it('should generate migration plan content', async () => {
      const servers: Server[] = [{ id: '1', name: 'Server1' } as Server];
      const vms: Vm[] = [];
      const ilos = new Map<string, Ilo>();
      const vCenterConfig = {
        ip: '192.168.1.100',
        user: 'admin',
        password: 'password',
      };
      const upsConfig: UpsConfig = {
        shutdownGrace: 300,
        restartGrace: 60,
      };

      const mockPlan: MigrationPlanConfig = {
        vCenter: { ...vCenterConfig, port: 443 },
        ups: upsConfig,
        servers: [],
      };

      mockPlanBuilderService.buildMigrationPlan.mockReturnValue(mockPlan);
      mockYamlParserService.generateYaml.mockReturnValue('yaml-content');

      const result = await service.generateMigrationPlan(
        servers,
        vms,
        ilos,
        vCenterConfig,
        upsConfig,
      );

      expect(mockPlanBuilderService.buildMigrationPlan).toHaveBeenCalledWith(
        servers,
        vms,
        ilos,
        { ...vCenterConfig, port: 443 },
        upsConfig,
        undefined,
      );
      expect(mockYamlParserService.generateYaml).toHaveBeenCalledWith(mockPlan);
      expect(result).toBe('yaml-content');
    });
  });

  describe('generateMigrationPlanContent', () => {
    it('should generate YAML content from config', () => {
      const config: MigrationPlanConfig = {
        vCenter: {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        },
        ups: {
          shutdownGrace: 300,
          restartGrace: 60,
        },
        servers: [],
      };

      mockYamlParserService.generateYaml.mockReturnValue('yaml-content');

      const result = service.generateMigrationPlanContent(config);

      expect(mockYamlParserService.generateYaml).toHaveBeenCalledWith(config);
      expect(result).toBe('yaml-content');
    });
  });

  describe('parseMigrationPlanContent', () => {
    it('should parse YAML content to config', () => {
      const content = 'yaml-content';
      const expectedConfig: MigrationPlanConfig = {
        vCenter: {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        },
        ups: {
          shutdownGrace: 300,
          restartGrace: 60,
        },
        servers: [],
      };

      mockYamlParserService.parseYaml.mockReturnValue(expectedConfig);

      const result = service.parseMigrationPlanContent(content);

      expect(mockYamlParserService.parseYaml).toHaveBeenCalledWith(content);
      expect(result).toEqual(expectedConfig);
    });
  });

  describe('writeMigrationPlan', () => {
    it('should write migration plan to file', async () => {
      const filename = 'test.yml';
      const content = 'yaml-content';
      const expectedPath = '/path/to/file';

      mockFileRepository.write.mockResolvedValue(expectedPath);

      const result = await service.writeMigrationPlan(filename, content);

      expect(mockFileRepository.write).toHaveBeenCalledWith(filename, content);
      expect(result).toBe(expectedPath);
    });
  });

  describe('readMigrationPlan', () => {
    it('should read and parse migration plan', async () => {
      const filename = 'test.yml';
      const content = 'yaml-content';
      const expectedConfig: MigrationPlanConfig = {
        vCenter: {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        },
        ups: {
          shutdownGrace: 300,
          restartGrace: 60,
        },
        servers: [],
      };

      mockFileRepository.read.mockResolvedValue(content);
      mockYamlParserService.parseYaml.mockReturnValue(expectedConfig);

      const result = await service.readMigrationPlan(filename);

      expect(mockFileRepository.read).toHaveBeenCalledWith(filename);
      expect(mockYamlParserService.parseYaml).toHaveBeenCalledWith(content);
      expect(result).toEqual(expectedConfig);
    });
  });

  describe('deleteMigrationPlan', () => {
    it('should delete migration plan file', async () => {
      const filename = 'test.yml';

      await service.deleteMigrationPlan(filename);

      expect(mockFileRepository.delete).toHaveBeenCalledWith(filename);
    });
  });

  describe('listMigrationPlans', () => {
    it('should list migration plan files', async () => {
      const files = ['test1.yml', 'test2.yml'];

      mockFileRepository.list.mockResolvedValue(files);

      const result = await service.listMigrationPlans();

      expect(mockFileRepository.list).toHaveBeenCalled();
      expect(result).toEqual(files);
    });
  });
});
