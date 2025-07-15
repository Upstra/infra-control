import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RemoveMigrationDestinationUseCase } from '../remove-migration-destination.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

describe('RemoveMigrationDestinationUseCase', () => {
  let useCase: RemoveMigrationDestinationUseCase;
  let serverRepository: Repository<Server>;
  let vmRepository: Repository<Vm>;
  let iloRepository: Repository<Ilo>;
  let yamlConfigService: YamlConfigService;

  const mockServerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
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
        RemoveMigrationDestinationUseCase,
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

    useCase = module.get<RemoveMigrationDestinationUseCase>(RemoveMigrationDestinationUseCase);
    serverRepository = module.get<Repository<Server>>(getRepositoryToken(Server));
    vmRepository = module.get<Repository<Vm>>(getRepositoryToken(Vm));
    iloRepository = module.get<Repository<Ilo>>(getRepositoryToken(Ilo));
    yamlConfigService = module.get<YamlConfigService>(YamlConfigService);
    
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should remove migration destination successfully', async () => {
      const sourceServerId = 'server-1';
      const sourceServer: Server = {
        id: sourceServerId,
        type: 'esxi',
        name: 'ESXi-1',
      } as Server;

      const vCenterServer: Server = {
        id: 'vcenter-1',
        type: 'vcenter',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
      } as Server;

      const allServers: Server[] = [sourceServer];
      const vms: Vm[] = [];
      const ilos: Ilo[] = [];

      mockServerRepository.findOne
        .mockResolvedValueOnce(sourceServer)
        .mockResolvedValueOnce(vCenterServer);
      mockServerRepository.find.mockResolvedValue(allServers);
      mockVmRepository.find.mockResolvedValue(vms);
      mockIloRepository.find.mockResolvedValue(ilos);
      mockYamlConfigService.generateMigrationPlan.mockResolvedValue('yaml-content');
      mockYamlConfigService.writeMigrationPlan.mockResolvedValue('/path/to/file');

      await useCase.execute(sourceServerId);

      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { id: sourceServerId, type: 'esxi' },
      });
      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { type: 'vcenter' },
      });
      expect(mockYamlConfigService.generateMigrationPlan).toHaveBeenCalledWith(
        allServers,
        vms,
        expect.any(Map),
        {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
        },
        new Map(),
      );
      expect(mockYamlConfigService.writeMigrationPlan).toHaveBeenCalledWith(
        'migration.yml',
        'yaml-content',
      );
    });

    it('should throw NotFoundException when source server not found', async () => {
      const sourceServerId = 'non-existent-server';

      mockServerRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute(sourceServerId)).rejects.toThrow(
        new NotFoundException('Source server not found'),
      );

      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { id: sourceServerId, type: 'esxi' },
      });
    });

    it('should throw NotFoundException when vCenter server not found', async () => {
      const sourceServerId = 'server-1';
      const sourceServer: Server = {
        id: sourceServerId,
        type: 'esxi',
        name: 'ESXi-1',
      } as Server;

      mockServerRepository.findOne
        .mockResolvedValueOnce(sourceServer)
        .mockResolvedValueOnce(null);

      await expect(useCase.execute(sourceServerId)).rejects.toThrow(
        new NotFoundException('vCenter server not found in database'),
      );

      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { type: 'vcenter' },
      });
    });
  });
});