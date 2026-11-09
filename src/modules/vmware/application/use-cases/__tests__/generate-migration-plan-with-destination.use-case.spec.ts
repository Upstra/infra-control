import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  GenerateMigrationPlanWithDestinationUseCase,
  MigrationDestination,
} from '../generate-migration-plan-with-destination.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';
import { Ups } from '../../../../ups/domain/entities/ups.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

/** A TypeORM query builder whose terminal call resolves to `result`. */
const queryBuilder = (terminal: 'getRawOne' | 'getRawMany', result: unknown) => {
  const qb: Record<string, jest.Mock> = {};
  ['select', 'addSelect', 'where'].forEach(
    (method) => (qb[method] = jest.fn(() => qb)),
  );
  qb[terminal] = jest.fn().mockResolvedValue(result);
  return qb;
};

// The vCenter row comes from getRawOne() so the password column is selected.
const vCenterRow = {
  server_ip: '192.168.1.100',
  server_login: 'admin',
  server_password: 'password',
  server_adminUrl: 'https://192.168.1.100',
};

const ups = { id: 'ups-1', grace_period_on: 30, grace_period_off: 10 } as Ups;

describe('GenerateMigrationPlanWithDestinationUseCase', () => {
  let useCase: GenerateMigrationPlanWithDestinationUseCase;
  const mockServerRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockVmRepository = { find: jest.fn() };
  const mockIloRepository = { createQueryBuilder: jest.fn() };
  const mockYamlConfigService = {
    generateMigrationPlan: jest.fn(),
    writeMigrationPlan: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateMigrationPlanWithDestinationUseCase,
        { provide: getRepositoryToken(Server), useValue: mockServerRepository },
        { provide: getRepositoryToken(Vm), useValue: mockVmRepository },
        { provide: getRepositoryToken(Ilo), useValue: mockIloRepository },
        { provide: getRepositoryToken(Ups), useValue: {} },
        { provide: YamlConfigService, useValue: mockYamlConfigService },
      ],
    }).compile();

    useCase = module.get(GenerateMigrationPlanWithDestinationUseCase);

    mockServerRepository.createQueryBuilder.mockReturnValue(
      queryBuilder('getRawOne', vCenterRow),
    );
    mockIloRepository.createQueryBuilder.mockReturnValue(
      queryBuilder('getRawMany', [
        {
          ilo_id: 'ilo-1',
          ilo_ip: '10.0.0.11',
          ilo_login: 'admin',
          ilo_password: 'secret',
        },
      ]),
    );
    mockYamlConfigService.generateMigrationPlan.mockResolvedValue('yaml-content');
    mockYamlConfigService.writeMigrationPlan.mockResolvedValue('/path/to/file');
  });

  describe('execute', () => {
    it('generates the plan with destinations, iLOs, vCenter and UPS grace periods', async () => {
      const servers = [
        { id: 'esxi-1', type: 'esxi', name: 'ESXi-1', priority: 1, ups },
        { id: 'esxi-2', type: 'esxi', name: 'ESXi-2', priority: 2, ups },
      ] as Server[];
      const vms = [
        { id: 'vm-1', serverId: 'esxi-1', moid: 'vm-moid-1', priority: 1 },
      ] as Vm[];
      mockServerRepository.find.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue(vms);

      await useCase.execute([
        { sourceServerId: 'esxi-1', destinationServerId: 'esxi-2' },
      ]);

      expect(mockServerRepository.find).toHaveBeenCalledWith({
        where: [{ id: 'esxi-1' }, { id: 'esxi-2' }],
        relations: ['ups'],
      });
      expect(mockVmRepository.find).toHaveBeenCalledWith({
        where: [{ serverId: 'esxi-1' }],
        order: { serverId: 'ASC', priority: 'ASC' },
      });

      const [sources, planVms, ilos, vCenter, upsConfig, destinations] =
        mockYamlConfigService.generateMigrationPlan.mock.calls[0];
      expect(sources).toEqual([servers[0]]);
      expect(planVms).toBe(vms);
      expect(ilos.get('ilo-1')).toEqual({
        id: 'ilo-1',
        ip: '10.0.0.11',
        login: 'admin',
        password: 'secret',
      });
      expect(vCenter).toEqual({
        ip: '192.168.1.100',
        user: 'admin',
        password: 'password',
        adminUrl: 'https://192.168.1.100',
      });
      expect(upsConfig).toEqual({ shutdownGrace: 10, restartGrace: 30 });
      expect(destinations.get('esxi-1')).toBe(servers[1]);

      expect(mockYamlConfigService.writeMigrationPlan).toHaveBeenCalledWith(
        'migration.yml',
        'yaml-content',
      );
    });

    it('throws NotFoundException when no vCenter is in the database', async () => {
      mockServerRepository.createQueryBuilder.mockReturnValue(
        queryBuilder('getRawOne', undefined),
      );

      await expect(
        useCase.execute([{ sourceServerId: 'esxi-1', destinationServerId: 'esxi-2' }]),
      ).rejects.toThrow(new NotFoundException('vCenter server not found in database'));
    });

    it('throws NotFoundException when the vCenter has no password', async () => {
      mockServerRepository.createQueryBuilder.mockReturnValue(
        queryBuilder('getRawOne', { ...vCenterRow, server_password: null }),
      );

      await expect(
        useCase.execute([{ sourceServerId: 'esxi-1' }]),
      ).rejects.toThrow(/password not found/);
    });

    it('requires a UPS on the source servers', async () => {
      mockServerRepository.find.mockResolvedValue([
        { id: 'esxi-1', type: 'esxi', name: 'ESXi-1', priority: 1 },
      ]);
      mockVmRepository.find.mockResolvedValue([]);

      await expect(
        useCase.execute([{ sourceServerId: 'esxi-1' }]),
      ).rejects.toThrow(/No UPS found/);
    });

    it('ignores a vCenter given as destination', async () => {
      const servers = [
        { id: 'esxi-1', type: 'esxi', name: 'ESXi-1', priority: 1, ups },
        { id: 'vcenter-2', type: 'vcenter', name: 'vCenter-2', priority: 2 },
      ] as Server[];
      mockServerRepository.find.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue([]);

      await useCase.execute([
        { sourceServerId: 'esxi-1', destinationServerId: 'vcenter-2' },
      ]);

      const [sources, , , , , destinations] =
        mockYamlConfigService.generateMigrationPlan.mock.calls[0];
      expect(sources).toEqual([servers[0]]);
      expect(destinations.size).toBe(0);
    });

    it('rejects duplicate source servers', async () => {
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

    it('rejects the same server as source and destination', async () => {
      await expect(
        useCase.execute([{ sourceServerId: 'esxi-1', destinationServerId: 'esxi-1' }]),
      ).rejects.toThrow(
        new BadRequestException(
          'Source and destination server cannot be the same',
        ),
      );
    });
  });
});
