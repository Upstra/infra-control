import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GenerateMigrationPlanUseCase } from '../generate-migration-plan.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Ilo } from '../../../../ilos/domain/entities/ilo.entity';
import { Ups } from '../../../../ups/domain/entities/ups.entity';
import { YamlConfigService } from '@/core/services/yaml-config/application/yaml-config.service';

describe('GenerateMigrationPlanUseCase', () => {
  let useCase: GenerateMigrationPlanUseCase;

  // The vCenter is read through a query builder so its password is selected.
  const vCenterQuery = { getOne: jest.fn() } as Record<string, jest.Mock>;
  ['addSelect', 'where'].forEach(
    (method) => (vCenterQuery[method] = jest.fn(() => vCenterQuery)),
  );

  const mockServerRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => vCenterQuery),
  };
  const mockVmRepository = { find: jest.fn() };
  const mockIloRepository = { find: jest.fn() };
  const mockYamlConfigService = {
    generateMigrationPlan: jest.fn(),
    writeMigrationPlan: jest.fn(),
  };

  const vCenterServer = {
    id: 'vcenter-1',
    type: 'vcenter',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
    adminUrl: 'https://192.168.1.100:8443',
  } as Server;

  const ups = { grace_period_on: 30, grace_period_off: 10 } as Ups;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateMigrationPlanUseCase,
        { provide: getRepositoryToken(Server), useValue: mockServerRepository },
        { provide: getRepositoryToken(Vm), useValue: mockVmRepository },
        { provide: getRepositoryToken(Ilo), useValue: mockIloRepository },
        { provide: getRepositoryToken(Ups), useValue: {} },
        { provide: YamlConfigService, useValue: mockYamlConfigService },
      ],
    }).compile();

    useCase = module.get(GenerateMigrationPlanUseCase);
    vCenterQuery.getOne.mockResolvedValue(vCenterServer);
    mockYamlConfigService.generateMigrationPlan.mockResolvedValue('yaml-content');
    mockYamlConfigService.writeMigrationPlan.mockResolvedValue('/path/to/file');
  });

  it('generates and writes the plan with every ESXi, the vCenter and the UPS grace periods', async () => {
    const esxiServers = [
      { id: 'esxi-1', type: 'esxi', name: 'ESXi-1', priority: 1, ups },
    ] as Server[];
    const vms = [
      { id: 'vm-1', serverId: 'esxi-1', moid: 'vm-moid-1', priority: 1 },
    ] as Vm[];
    const ilos = [{ id: 'ilo-1', ip: '192.168.1.10' }] as Ilo[];
    mockServerRepository.find.mockResolvedValue(esxiServers);
    mockVmRepository.find.mockResolvedValue(vms);
    mockIloRepository.find.mockResolvedValue(ilos);

    await useCase.execute();

    expect(mockServerRepository.find).toHaveBeenCalledWith({
      where: { type: 'esxi' },
      order: { priority: 'ASC' },
      relations: ['ups'],
    });
    expect(mockVmRepository.find).toHaveBeenCalledWith({
      order: { serverId: 'ASC', priority: 'ASC' },
    });

    const [servers, planVms, iloMap, vCenter, upsConfig] =
      mockYamlConfigService.generateMigrationPlan.mock.calls[0];
    expect(servers).toBe(esxiServers);
    expect(planVms).toBe(vms);
    expect(iloMap.get('ilo-1')).toBe(ilos[0]);
    expect(vCenter).toEqual({
      ip: '192.168.1.100',
      user: 'admin',
      password: 'password',
      adminUrl: 'https://192.168.1.100:8443',
    });
    expect(upsConfig).toEqual({ shutdownGrace: 10, restartGrace: 30 });
    expect(mockYamlConfigService.writeMigrationPlan).toHaveBeenCalledWith(
      'migration.yml',
      'yaml-content',
    );
  });

  it('never logs the vCenter password', async () => {
    const debug = jest.spyOn((useCase as any).logger, 'debug');
    mockServerRepository.find.mockResolvedValue([
      { id: 'esxi-1', type: 'esxi', priority: 1, ups },
    ]);
    mockVmRepository.find.mockResolvedValue([]);
    mockIloRepository.find.mockResolvedValue([]);

    await useCase.execute();

    const logged = debug.mock.calls.flat().map(String).join('\n');
    expect(logged).not.toContain('password');
  });

  it('throws NotFoundException when no vCenter is in the database', async () => {
    vCenterQuery.getOne.mockResolvedValue(null);

    await expect(useCase.execute()).rejects.toThrow(
      new NotFoundException('vCenter server not found in database'),
    );
    expect(mockServerRepository.find).not.toHaveBeenCalled();
    expect(mockYamlConfigService.generateMigrationPlan).not.toHaveBeenCalled();
  });

  it('requires a UPS on the ESXi servers', async () => {
    mockServerRepository.find.mockResolvedValue([]);
    mockVmRepository.find.mockResolvedValue([]);
    mockIloRepository.find.mockResolvedValue([]);

    await expect(useCase.execute()).rejects.toThrow(/No UPS found/);
    expect(mockYamlConfigService.generateMigrationPlan).not.toHaveBeenCalled();
  });
});
