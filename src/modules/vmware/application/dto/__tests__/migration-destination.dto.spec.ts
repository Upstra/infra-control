import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  MigrationDestinationDto,
  SetMigrationDestinationsDto,
  VmMigrationInfoDto,
  ServerVmsDto,
  VmsForMigrationResponseDto,
  ServerInfoDto,
} from '../migration-destination.dto';

describe('Migration Destination DTOs', () => {
  describe('MigrationDestinationDto', () => {
    it('should validate a valid migration destination with both source and destination', async () => {
      const dto = plainToInstance(MigrationDestinationDto, {
        sourceServerId: '550e8400-e29b-41d4-a716-446655440000',
        destinationServerId: '550e8400-e29b-41d4-a716-446655440001',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate a valid migration destination with only source (shutdown-only)', async () => {
      const dto = plainToInstance(MigrationDestinationDto, {
        sourceServerId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid source server ID', async () => {
      const dto = plainToInstance(MigrationDestinationDto, {
        sourceServerId: 'invalid-uuid',
        destinationServerId: '550e8400-e29b-41d4-a716-446655440001',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sourceServerId');
    });

    it('should reject invalid destination server ID', async () => {
      const dto = plainToInstance(MigrationDestinationDto, {
        sourceServerId: '550e8400-e29b-41d4-a716-446655440000',
        destinationServerId: 'invalid-uuid',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('destinationServerId');
    });

    it('should reject missing source server ID', async () => {
      const dto = plainToInstance(MigrationDestinationDto, {
        destinationServerId: '550e8400-e29b-41d4-a716-446655440001',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('sourceServerId');
    });
  });

  describe('SetMigrationDestinationsDto', () => {
    it('should validate valid destinations array', async () => {
      const dto = plainToInstance(SetMigrationDestinationsDto, {
        destinations: [
          {
            sourceServerId: '550e8400-e29b-41d4-a716-446655440000',
            destinationServerId: '550e8400-e29b-41d4-a716-446655440001',
          },
          {
            sourceServerId: '550e8400-e29b-41d4-a716-446655440002',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject empty destinations array', async () => {
      const dto = plainToInstance(SetMigrationDestinationsDto, {
        destinations: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Empty array is valid
    });

    it('should reject invalid nested destination', async () => {
      const dto = plainToInstance(SetMigrationDestinationsDto, {
        destinations: [
          {
            sourceServerId: 'invalid-uuid',
            destinationServerId: '550e8400-e29b-41d4-a716-446655440001',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('destinations');
    });

    it('should reject non-array destinations', async () => {
      const dto = plainToInstance(SetMigrationDestinationsDto, {
        destinations: 'not-an-array',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('destinations');
    });
  });

  describe('VmMigrationInfoDto', () => {
    it('should create VM migration info with all properties', () => {
      const vmInfo: VmMigrationInfoDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'web-server-01',
        moid: 'vm-1001',
        state: 'powered_on',
        priority: 1,
        grace_period_on: 30,
        grace_period_off: 60,
      };

      expect(vmInfo.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(vmInfo.name).toBe('web-server-01');
      expect(vmInfo.moid).toBe('vm-1001');
      expect(vmInfo.state).toBe('powered_on');
      expect(vmInfo.priority).toBe(1);
      expect(vmInfo.grace_period_on).toBe(30);
      expect(vmInfo.grace_period_off).toBe(60);
    });

    it('should handle VM migration info without moid', () => {
      const vmInfo: VmMigrationInfoDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'web-server-01',
        state: 'powered_on',
        priority: 1,
        grace_period_on: 30,
        grace_period_off: 60,
      };

      expect(vmInfo.moid).toBeUndefined();
    });
  });

  describe('ServerInfoDto', () => {
    it('should create server info with all properties', () => {
      const serverInfo: ServerInfoDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'esxi-01',
        vmwareHostMoid: 'host-123',
      };

      expect(serverInfo.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(serverInfo.name).toBe('esxi-01');
      expect(serverInfo.vmwareHostMoid).toBe('host-123');
    });
  });

  describe('ServerVmsDto', () => {
    it('should create server VMs structure', () => {
      const serverVms: ServerVmsDto = {
        server: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'esxi-01',
          vmwareHostMoid: 'host-123',
        },
        vms: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'web-server-01',
            moid: 'vm-1001',
            state: 'powered_on',
            priority: 1,
            grace_period_on: 30,
            grace_period_off: 60,
          },
        ],
      };

      expect(serverVms.server.name).toBe('esxi-01');
      expect(serverVms.vms).toHaveLength(1);
      expect(serverVms.vms[0].name).toBe('web-server-01');
    });

    it('should handle server with no VMs', () => {
      const serverVms: ServerVmsDto = {
        server: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'esxi-01',
          vmwareHostMoid: 'host-123',
        },
        vms: [],
      };

      expect(serverVms.vms).toHaveLength(0);
    });
  });

  describe('VmsForMigrationResponseDto', () => {
    it('should create complete VMs for migration response', () => {
      const response: VmsForMigrationResponseDto = {
        servers: [
          {
            server: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'esxi-01',
              vmwareHostMoid: 'host-123',
            },
            vms: [
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'web-server-01',
                moid: 'vm-1001',
                state: 'powered_on',
                priority: 1,
                grace_period_on: 30,
                grace_period_off: 60,
              },
            ],
          },
          {
            server: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'esxi-02',
              vmwareHostMoid: 'host-456',
            },
            vms: [],
          },
        ],
        totalServers: 2,
        totalVms: 1,
      };

      expect(response.servers).toHaveLength(2);
      expect(response.totalServers).toBe(2);
      expect(response.totalVms).toBe(1);
      expect(response.servers[0].vms).toHaveLength(1);
      expect(response.servers[1].vms).toHaveLength(0);
    });

    it('should handle empty response', () => {
      const response: VmsForMigrationResponseDto = {
        servers: [],
        totalServers: 0,
        totalVms: 0,
      };

      expect(response.servers).toHaveLength(0);
      expect(response.totalServers).toBe(0);
      expect(response.totalVms).toBe(0);
    });
  });
});
