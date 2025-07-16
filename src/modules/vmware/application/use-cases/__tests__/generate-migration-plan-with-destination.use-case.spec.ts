import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  GenerateMigrationPlanWithDestinationUseCase,
  MigrationDestination,
} from '../generate-migration-plan-with-destination.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

describe('GenerateMigrationPlanWithDestinationUseCase', () => {
  let useCase: GenerateMigrationPlanWithDestinationUseCase;
  let serverRepository: Repository<Server>;
  let vmRepository: Repository<Vm>;
  let iloRepository: Repository<Ilo>;
  let yamlConfigService: YamlConfigService;

  const mockServerRepository = {
    findOne: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockVmRepository = {
    find: jest.fn(),
  };

  const mockIloRepository = {
    find: jest.fn(),
  };

  const mockYamlConfigService = {
    generateMigrationPlan: jest.fn(),
    writeMigrationPlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateMigrationPlanWithDestinationUseCase,
        {
          provide: getRepositoryToken(Server),
          useValue: mockServerRepository,
        },
        {
          provide: getRepositoryToken(Vm),
          useValue: mockVmRepository,
        },
        {
          provide: getRepositoryToken(Ilo),
          useValue: mockIloRepository,
        },
        {
          provide: YamlConfigService,
          useValue: mockYamlConfigService,
        },
      ],
    }).compile();

    useCase = module.get<GenerateMigrationPlanWithDestinationUseCase>(
      GenerateMigrationPlanWithDestinationUseCase,
    );
    serverRepository = module.get<Repository<Server>>(
      getRepositoryToken(Server),
    );
    vmRepository = module.get<Repository<Vm>>(getRepositoryToken(Vm));
    iloRepository = module.get<Repository<Ilo>>(getRepositoryToken(Ilo));
    yamlConfigService = module.get<YamlConfigService>(YamlConfigService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should generate migration plan with destinations', async () => {
      const vCenterServer: Server = {
        id: 'vcenter-1',
        type: 'vcenter',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
      } as Server;

      const destinations: MigrationDestination[] = [
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-2' },
      ];

      const servers: Server[] = [
        {
          id: 'esxi-1',
          type: 'esxi',
          name: 'ESXi-1',
          priority: 1,
        } as Server,
        {
          id: 'esxi-2',
          type: 'esxi',
          name: 'ESXi-2',
          priority: 2,
        } as Server,
      ];

      const vms: Vm[] = [
        {
          id: 'vm-1',
          serverId: 'esxi-1',
          moid: 'vm-moid-1',
          priority: 1,
        } as Vm,
      ];

      const ilos: Ilo[] = [];

      mockServerRepository.findOne.mockResolvedValue(vCenterServer);
      mockServerRepository.findByIds.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue(vms);
      mockIloRepository.find.mockResolvedValue(ilos);
      mockYamlConfigService.generateMigrationPlan.mockResolvedValue(
        'yaml-content',
      );
      mockYamlConfigService.writeMigrationPlan.mockResolvedValue(
        '/path/to/file',
      );

      await useCase.execute(destinations);

      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { type: 'vcenter' },
      });
      expect(mockServerRepository.findByIds).toHaveBeenCalledWith([
        'esxi-1',
        'esxi-2',
      ]);
      expect(mockVmRepository.find).toHaveBeenCalledWith({
        where: [{ serverId: 'esxi-1' }],
        order: { serverId: 'ASC', priority: 'ASC' },
      });

      expect(mockYamlConfigService.generateMigrationPlan).toHaveBeenCalledWith(
        [servers[0]],
        vms,
        expect.any(Map),
        {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
        },
        expect.any(Map),
      );

      expect(mockYamlConfigService.writeMigrationPlan).toHaveBeenCalledWith(
        'migration.yml',
        'yaml-content',
      );
    });

    it('should throw NotFoundException when vCenter server not found', async () => {
      mockServerRepository.findOne.mockResolvedValue(null);

      const destinations: MigrationDestination[] = [
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-2' },
      ];

      await expect(useCase.execute(destinations)).rejects.toThrow(
        new NotFoundException('vCenter server not found in database'),
      );
    });

    it('should filter out non-esxi servers', async () => {
      const vCenterServer: Server = {
        id: 'vcenter-1',
        type: 'vcenter',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
      } as Server;

      const destinations: MigrationDestination[] = [
        { sourceServerId: 'esxi-1', destinationServerId: 'vcenter-2' },
      ];

      const servers: Server[] = [
        {
          id: 'esxi-1',
          type: 'esxi',
          name: 'ESXi-1',
          priority: 1,
        } as Server,
        {
          id: 'vcenter-2',
          type: 'vcenter',
          name: 'vCenter-2',
          priority: 2,
        } as Server,
      ];

      mockServerRepository.findOne.mockResolvedValue(vCenterServer);
      mockServerRepository.findByIds.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue([]);
      mockIloRepository.find.mockResolvedValue([]);
      mockYamlConfigService.generateMigrationPlan.mockResolvedValue(
        'yaml-content',
      );
      mockYamlConfigService.writeMigrationPlan.mockResolvedValue(
        '/path/to/file',
      );

      await useCase.execute(destinations);

      expect(mockYamlConfigService.generateMigrationPlan).toHaveBeenCalledWith(
        [servers[0]],
        [],
        expect.any(Map),
        expect.any(Object),
        new Map(),
      );
    });

    it('should throw BadRequestException for duplicate source servers', async () => {
      const destinations: MigrationDestination[] = [
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-2' },
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-3' },
      ];

      await expect(useCase.execute(destinations)).rejects.toThrow(
        new BadRequestException(
          'Each source server can have at most one destination',
        ),
      );
    });

    it('should throw BadRequestException for same source and destination', async () => {
      const destinations: MigrationDestination[] = [
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-1' },
      ];

      await expect(useCase.execute(destinations)).rejects.toThrow(
        new BadRequestException(
          'Source and destination server cannot be the same',
        ),
      );
    });
  });
});
