import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { MigrationPlanBuilderService } from '../migration-plan-builder.service';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { VCenterConfig, UpsConfig } from '../../interfaces/yaml-config.interface';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

describe('MigrationPlanBuilderService', () => {
  let service: MigrationPlanBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MigrationPlanBuilderService],
    }).compile();

    service = module.get<MigrationPlanBuilderService>(
      MigrationPlanBuilderService,
    );
  });

  describe('buildMigrationPlan', () => {
    it('should build migration plan with servers and VMs', () => {
      const servers: Server[] = [
        {
          id: '1',
          name: 'Server1',
          vmwareHostMoid: 'host-123',
          iloId: 'ilo-1',
        } as Server,
      ];

      const vms: Vm[] = [
        {
          id: 'vm-1',
          serverId: '1',
          moid: 'vm-moid-1',
          priority: 2,
        } as Vm,
        {
          id: 'vm-2',
          serverId: '1',
          moid: 'vm-moid-2',
          priority: 1,
        } as Vm,
      ];

      const ilos = new Map<string, Ilo>([
        [
          'ilo-1',
          {
            id: 'ilo-1',
            ip: '192.168.1.10',
            login: 'admin',
            password: 'password',
          } as Ilo,
        ],
      ]);

      const vCenterConfig: VCenterConfig = {
        ip: '192.168.1.100',
        user: 'vcenter-user',
        password: 'vcenter-password',
        port: 443,
      };

      const upsConfig: UpsConfig = {
        shutdownGrace: 300,
        restartGrace: 60,
      };

      const result = service.buildMigrationPlan(
        servers,
        vms,
        ilos,
        vCenterConfig,
        upsConfig,
      );

      expect(result.vCenter).toEqual(vCenterConfig);
      expect(result.ups).toEqual(upsConfig);
      expect(result.servers).toHaveLength(1);
      expect(result.servers[0].server.host.name).toBe('Server1');
      expect(result.servers[0].server.host.moid).toBe('host-123');
      expect(result.servers[0].server.host.ilo).toEqual({
        ip: '192.168.1.10',
        user: 'admin',
        password: 'password',
      });
      expect(result.servers[0].server.vmOrder).toEqual([
        { vmMoId: 'vm-moid-2' },
        { vmMoId: 'vm-moid-1' },
      ]);
    });

    it('should build migration plan with destination servers', () => {
      const servers: Server[] = [
        {
          id: '1',
          name: 'Server1',
          vmwareHostMoid: 'host-123',
          iloId: 'ilo-1',
        } as Server,
      ];

      const destinationServers = new Map<string, Server>([
        [
          '1',
          {
            id: '2',
            name: 'Server2',
            vmwareHostMoid: 'host-456',
            iloId: 'ilo-2',
          } as Server,
        ],
      ]);

      const vms: Vm[] = [];

      const ilos = new Map<string, Ilo>([
        [
          'ilo-1',
          {
            id: 'ilo-1',
            ip: '192.168.1.10',
            login: 'admin',
            password: 'password',
          } as Ilo,
        ],
        [
          'ilo-2',
          {
            id: 'ilo-2',
            ip: '192.168.1.11',
            login: 'admin',
            password: 'password',
          } as Ilo,
        ],
      ]);

      const vCenterConfig: VCenterConfig = {
        ip: '192.168.1.100',
        user: 'vcenter-user',
        password: 'vcenter-password',
        port: 443,
      };

      const upsConfig: UpsConfig = {
        shutdownGrace: 300,
        restartGrace: 60,
      };

      const result = service.buildMigrationPlan(
        servers,
        vms,
        ilos,
        vCenterConfig,
        upsConfig,
        destinationServers,
      );

      expect(result.servers[0].server.destination).toBeDefined();
      expect(result.servers[0].server.destination.name).toBe('Server2');
      expect(result.servers[0].server.destination.moid).toBe('host-456');
      expect(result.servers[0].server.destination.ilo).toEqual({
        ip: '192.168.1.11',
        user: 'admin',
        password: 'password',
      });
    });

    it('should handle servers without iLO', () => {
      const servers: Server[] = [
        {
          id: '1',
          name: 'Server1',
          vmwareHostMoid: 'host-123',
          iloId: null,
        } as Server,
      ];

      const vms: Vm[] = [];
      const ilos = new Map<string, Ilo>();

      const vCenterConfig: VCenterConfig = {
        ip: '192.168.1.100',
        user: 'vcenter-user',
        password: 'vcenter-password',
        port: 443,
      };

      const upsConfig: UpsConfig = {
        shutdownGrace: 300,
        restartGrace: 60,
      };

      const result = service.buildMigrationPlan(
        servers,
        vms,
        ilos,
        vCenterConfig,
        upsConfig,
      );

      expect(result.servers[0].server.host.ilo).toBeUndefined();
    });

    it('should handle servers without vmwareHostMoid', () => {
      const servers: Server[] = [
        {
          id: '1',
          name: 'Server1',
          vmwareHostMoid: null,
          iloId: null,
        } as Server,
      ];

      const vms: Vm[] = [];
      const ilos = new Map<string, Ilo>();

      const vCenterConfig: VCenterConfig = {
        ip: '192.168.1.100',
        user: 'vcenter-user',
        password: 'vcenter-password',
        port: 443,
      };

      const upsConfig: UpsConfig = {
        shutdownGrace: 300,
        restartGrace: 60,
      };

      const result = service.buildMigrationPlan(
        servers,
        vms,
        ilos,
        vCenterConfig,
        upsConfig,
      );

      expect(result.servers[0].server.host.moid).toBe('');
    });
  });
});
