import { Test, TestingModule } from '@nestjs/testing';
import { GetMigrationDestinationsUseCase } from '../get-migration-destinations.use-case';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';
import { MigrationPlanConfig } from '@/core/services/yaml-config/domain/interfaces/yaml-config.interface';

describe('GetMigrationDestinationsUseCase', () => {
  let useCase: GetMigrationDestinationsUseCase;

  const mockYamlConfigService = {
    readMigrationPlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMigrationDestinationsUseCase,
        {
          provide: YamlConfigService,
          useValue: mockYamlConfigService,
        },
      ],
    }).compile();

    useCase = module.get<GetMigrationDestinationsUseCase>(
      GetMigrationDestinationsUseCase,
    );
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return migration destinations from YAML file', async () => {
      const mockMigrationPlan: MigrationPlanConfig = {
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
        servers: [
          {
            server: {
              host: {
                name: 'esxi-01',
                moid: 'host-123',
              },
              destination: {
                name: 'esxi-02',
                moid: 'host-456',
              },
              vmOrder: [],
            },
          },
          {
            server: {
              host: {
                name: 'esxi-03',
                moid: 'host-789',
              },
              vmOrder: [],
            },
          },
        ],
      };

      mockYamlConfigService.readMigrationPlan.mockResolvedValue(
        mockMigrationPlan,
      );

      const result = await useCase.execute();

      expect(mockYamlConfigService.readMigrationPlan).toHaveBeenCalledWith(
        'migration.yml',
      );
      expect(result).toEqual({
        destinations: [
          {
            sourceServer: {
              id: '',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            destinationServer: {
              id: '',
              name: 'esxi-02',
              vmwareHostMoid: 'host-456',
            },
          },
          {
            sourceServer: {
              id: '',
              name: 'esxi-03',
              vmwareHostMoid: 'host-789',
            },
          },
        ],
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      });
    });

    it('should return empty destinations when YAML file does not exist', async () => {
      const error = new Error('File not found');
      mockYamlConfigService.readMigrationPlan.mockRejectedValue(error);

      const result = await useCase.execute();

      expect(result).toEqual({
        destinations: [],
        yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
      });
    });

    it('should handle servers without destinations', async () => {
      const mockMigrationPlan: MigrationPlanConfig = {
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
        servers: [
          {
            server: {
              host: {
                name: 'esxi-01',
                moid: 'host-123',
              },
              vmOrder: [],
            },
          },
        ],
      };

      mockYamlConfigService.readMigrationPlan.mockResolvedValue(
        mockMigrationPlan,
      );

      const result = await useCase.execute();

      expect(result.destinations).toHaveLength(1);
      expect(result.destinations[0]).toEqual({
        sourceServer: {
          id: '',
          name: 'esxi-01',
          vmwareHostMoid: 'host-123',
        },
      });
      expect(result.destinations[0].destinationServer).toBeUndefined();
    });
  });
});
