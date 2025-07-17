import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GenerateMigrationPlanUseCase } from '../generate-migration-plan.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

describe('GenerateMigrationPlanUseCase', () => {
  let useCase: GenerateMigrationPlanUseCase;

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
        GenerateMigrationPlanUseCase,
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

    useCase = module.get<GenerateMigrationPlanUseCase>(
      GenerateMigrationPlanUseCase,
    );
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should generate and write migration plan successfully', async () => {
      const vCenterServer: Server = {
        id: 'vcenter-1',
        type: 'vcenter',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
      } as Server;

      const esxiServers: Server[] = [
        {
          id: 'esxi-1',
          type: 'esxi',
          name: 'ESXi-1',
          priority: 1,
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

      const ilos: Ilo[] = [
        {
          id: 'ilo-1',
          ip: '192.168.1.10',
          login: 'admin',
          password: 'password',
        } as Ilo,
      ];

      mockServerRepository.findOne.mockResolvedValue(vCenterServer);
      mockServerRepository.find.mockResolvedValue(esxiServers);
      mockVmRepository.find.mockResolvedValue(vms);
      mockIloRepository.find.mockResolvedValue(ilos);
      mockYamlConfigService.generateMigrationPlan.mockResolvedValue(
        'yaml-content',
      );
      mockYamlConfigService.writeMigrationPlan.mockResolvedValue(
        '/path/to/file',
      );

      await useCase.execute();

      expect(mockServerRepository.findOne).toHaveBeenCalledWith({
        where: { type: 'vcenter' },
      });
      expect(mockServerRepository.find).toHaveBeenCalledWith({
        where: { type: 'esxi' },
        order: { priority: 'ASC' },
      });
      expect(mockVmRepository.find).toHaveBeenCalledWith({
        order: { serverId: 'ASC', priority: 'ASC' },
      });
      expect(mockIloRepository.find).toHaveBeenCalled();

      expect(mockYamlConfigService.generateMigrationPlan).toHaveBeenCalledWith(
        esxiServers,
        vms,
        expect.any(Map),
        {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
        },
      );

      expect(mockYamlConfigService.writeMigrationPlan).toHaveBeenCalledWith(
        'migration.yml',
        'yaml-content',
      );
    });

    it('should throw NotFoundException when vCenter server not found', async () => {
      mockServerRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute()).rejects.toThrow(
        new NotFoundException('vCenter server not found in database'),
      );

      expect(mockServerRepository.find).not.toHaveBeenCalled();
      expect(mockVmRepository.find).not.toHaveBeenCalled();
      expect(mockIloRepository.find).not.toHaveBeenCalled();
      expect(
        mockYamlConfigService.generateMigrationPlan,
      ).not.toHaveBeenCalled();
    });

    it('should handle empty servers and VMs', async () => {
      const vCenterServer: Server = {
        id: 'vcenter-1',
        type: 'vcenter',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
      } as Server;

      mockServerRepository.findOne.mockResolvedValue(vCenterServer);
      mockServerRepository.find.mockResolvedValue([]);
      mockVmRepository.find.mockResolvedValue([]);
      mockIloRepository.find.mockResolvedValue([]);
      mockYamlConfigService.generateMigrationPlan.mockResolvedValue(
        'yaml-content',
      );
      mockYamlConfigService.writeMigrationPlan.mockResolvedValue(
        '/path/to/file',
      );

      await useCase.execute();

      expect(mockYamlConfigService.generateMigrationPlan).toHaveBeenCalledWith(
        [],
        [],
        expect.any(Map),
        {
          ip: '192.168.1.100',
          user: 'admin',
          password: 'password',
        },
      );
    });
  });
});
