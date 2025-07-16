import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetVmsForMigrationUseCase } from '../get-vms-for-migration.use-case';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

describe('GetVmsForMigrationUseCase', () => {
  let useCase: GetVmsForMigrationUseCase;
  let serverRepository: Repository<Server>;
  let vmRepository: Repository<Vm>;

  const mockServerRepository = {
    find: jest.fn(),
  };

  const mockVmRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVmsForMigrationUseCase,
        {
          provide: getRepositoryToken(Server),
          useValue: mockServerRepository,
        },
        {
          provide: getRepositoryToken(Vm),
          useValue: mockVmRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetVmsForMigrationUseCase>(GetVmsForMigrationUseCase);
    serverRepository = module.get<Repository<Server>>(
      getRepositoryToken(Server),
    );
    vmRepository = module.get<Repository<Vm>>(getRepositoryToken(Vm));

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return VMs grouped by ESXi servers', async () => {
      const servers: Server[] = [
        {
          id: 'server-1',
          name: 'esxi-01',
          type: 'esxi',
          vmwareHostMoid: 'host-123',
          priority: 1,
        } as Server,
        {
          id: 'server-2',
          name: 'esxi-02',
          type: 'esxi',
          vmwareHostMoid: 'host-456',
          priority: 2,
        } as Server,
      ];

      const vms: Vm[] = [
        {
          id: 'vm-1',
          name: 'web-server-01',
          serverId: 'server-1',
          moid: 'vm-1001',
          state: 'powered_on',
          priority: 1,
          grace_period_on: 30,
          grace_period_off: 60,
        } as Vm,
        {
          id: 'vm-2',
          name: 'db-server-01',
          serverId: 'server-1',
          moid: 'vm-1002',
          state: 'powered_on',
          priority: 2,
          grace_period_on: 45,
          grace_period_off: 90,
        } as Vm,
        {
          id: 'vm-3',
          name: 'app-server-01',
          serverId: 'server-2',
          moid: 'vm-2001',
          state: 'powered_off',
          priority: 1,
          grace_period_on: 30,
          grace_period_off: 60,
        } as Vm,
      ];

      mockServerRepository.find.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue(vms);

      const result = await useCase.execute();

      expect(mockServerRepository.find).toHaveBeenCalledWith({
        where: { type: 'esxi' },
        order: { priority: 'ASC', name: 'ASC' },
      });

      expect(mockVmRepository.find).toHaveBeenCalledWith({
        where: [{ serverId: 'server-1' }, { serverId: 'server-2' }],
        order: { serverId: 'ASC', priority: 'ASC' },
      });

      expect(result).toEqual({
        servers: [
          {
            server: {
              id: 'server-1',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            vms: [
              {
                id: 'vm-1',
                name: 'web-server-01',
                moid: 'vm-1001',
                state: 'powered_on',
                priority: 1,
                grace_period_on: 30,
                grace_period_off: 60,
              },
              {
                id: 'vm-2',
                name: 'db-server-01',
                moid: 'vm-1002',
                state: 'powered_on',
                priority: 2,
                grace_period_on: 45,
                grace_period_off: 90,
              },
            ],
          },
          {
            server: {
              id: 'server-2',
              name: 'esxi-02',
              vmwareHostMoid: 'host-456',
            },
            vms: [
              {
                id: 'vm-3',
                name: 'app-server-01',
                moid: 'vm-2001',
                state: 'powered_off',
                priority: 1,
                grace_period_on: 30,
                grace_period_off: 60,
              },
            ],
          },
        ],
        totalServers: 2,
        totalVms: 3,
      });
    });

    it('should handle servers without VMs', async () => {
      const servers: Server[] = [
        {
          id: 'server-1',
          name: 'esxi-01',
          type: 'esxi',
          vmwareHostMoid: 'host-123',
          priority: 1,
        } as Server,
      ];

      const vms: Vm[] = [];

      mockServerRepository.find.mockResolvedValue(servers);
      mockVmRepository.find.mockResolvedValue(vms);

      const result = await useCase.execute();

      expect(result).toEqual({
        servers: [
          {
            server: {
              id: 'server-1',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            vms: [],
          },
        ],
        totalServers: 1,
        totalVms: 0,
      });
    });

    it('should handle empty servers list', async () => {
      mockServerRepository.find.mockResolvedValue([]);
      mockVmRepository.find.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual({
        servers: [],
        totalServers: 0,
        totalVms: 0,
      });
    });
  });
});
