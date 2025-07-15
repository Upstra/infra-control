import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ExecuteMigrationPlanDto,
  MigrationStatusResponseDto,
} from '../migration-plan.dto';

describe('Migration DTOs', () => {
  describe('ExecuteMigrationPlanDto', () => {
    it('should validate with valid planPath', async () => {
      const dto = plainToInstance(ExecuteMigrationPlanDto, {
        planPath: '/path/to/migration-plan.yml',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty planPath', async () => {
      const dto = plainToInstance(ExecuteMigrationPlanDto, {
        planPath: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('planPath');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with non-string planPath', async () => {
      const dto = plainToInstance(ExecuteMigrationPlanDto, {
        planPath: 123,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('planPath');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation without planPath', async () => {
      const dto = plainToInstance(ExecuteMigrationPlanDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('planPath');
    });

    it('should ignore extra properties in validation', async () => {
      const dto = plainToInstance(ExecuteMigrationPlanDto, {
        planPath: '/valid/path',
        extraProperty: 'should be ignored',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      // Extra properties are not stripped by plainToInstance, but they are ignored by validation
      expect(dto.planPath).toBe('/valid/path');
    });
  });

  describe('MigrationStatusResponseDto', () => {
    it('should create valid response with all properties', () => {
      const dto = new MigrationStatusResponseDto();
      dto.state = 'idle';
      dto.events = [
        {
          type: 'vm_migration',
          timestamp: '2023-01-01T00:00:00.000Z',
          vmName: 'test-vm',
          success: true,
        },
      ];
      dto.currentOperation = 'Migrating VMs';
      dto.startTime = '2023-01-01T00:00:00.000Z';
      dto.endTime = '2023-01-01T01:00:00.000Z';
      dto.error = 'Some error occurred';

      expect(dto.state).toBe('idle');
      expect(dto.events).toHaveLength(1);
      expect(dto.currentOperation).toBe('Migrating VMs');
      expect(dto.startTime).toBe('2023-01-01T00:00:00.000Z');
      expect(dto.endTime).toBe('2023-01-01T01:00:00.000Z');
      expect(dto.error).toBe('Some error occurred');
    });

    it('should create valid response with minimal properties', () => {
      const dto = new MigrationStatusResponseDto();
      dto.state = 'in migration';
      dto.events = [];

      expect(dto.state).toBe('in migration');
      expect(dto.events).toEqual([]);
      expect(dto.currentOperation).toBeUndefined();
      expect(dto.startTime).toBeUndefined();
      expect(dto.endTime).toBeUndefined();
      expect(dto.error).toBeUndefined();
    });

    it('should handle all possible state values', () => {
      const states = ['idle', 'in migration', 'migrated', 'restarting', 'failed'];
      
      states.forEach(state => {
        const dto = new MigrationStatusResponseDto();
        dto.state = state;
        dto.events = [];
        
        expect(dto.state).toBe(state);
      });
    });

    it('should handle complex event structures', () => {
      const dto = new MigrationStatusResponseDto();
      dto.state = 'migrated';
      dto.events = [
        {
          type: 'vm_migration',
          timestamp: '2023-01-01T00:00:00.000Z',
          vmName: 'vm1',
          vmMoid: 'vm-123',
          sourceMoid: 'host-1',
          destinationMoid: 'host-2',
          success: true,
        },
        {
          type: 'vm_shutdown',
          timestamp: '2023-01-01T00:01:00.000Z',
          vmName: 'vm2',
          vmMoid: 'vm-456',
          success: false,
          error: 'Shutdown failed',
        },
        {
          type: 'server_shutdown',
          timestamp: '2023-01-01T00:02:00.000Z',
          serverMoid: 'server-789',
          serverName: 'esxi-01',
          success: true,
        },
      ];

      expect(dto.events).toHaveLength(3);
      expect(dto.events[0].type).toBe('vm_migration');
      expect(dto.events[1].type).toBe('vm_shutdown');
      expect(dto.events[2].type).toBe('server_shutdown');
    });

    it('should handle optional properties correctly', () => {
      const dto = plainToInstance(MigrationStatusResponseDto, {
        state: 'idle',
        events: [],
      });

      expect(dto.state).toBe('idle');
      expect(dto.events).toEqual([]);
      expect(dto.currentOperation).toBeUndefined();
      expect(dto.startTime).toBeUndefined();
      expect(dto.endTime).toBeUndefined();
      expect(dto.error).toBeUndefined();
    });

    it('should transform from plain object correctly', () => {
      const plainObject = {
        state: 'restarting',
        events: [
          { type: 'vm_migration', success: true },
        ],
        currentOperation: 'Restarting servers',
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: null,
        error: null,
      };

      const dto = plainToInstance(MigrationStatusResponseDto, plainObject);

      expect(dto.state).toBe('restarting');
      expect(dto.events).toHaveLength(1);
      expect(dto.currentOperation).toBe('Restarting servers');
      expect(dto.startTime).toBe('2023-01-01T00:00:00.000Z');
      expect(dto.endTime).toBeNull();
      expect(dto.error).toBeNull();
    });
  });
});