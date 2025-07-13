import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  BulkCreateRequestDto,
  BulkRoomDto,
  BulkUpsDto,
  BulkServerDto,
} from '../bulk-create.dto';

describe('BulkCreateDto', () => {
  describe('BulkRoomDto', () => {
    it('should validate a valid room', async () => {
      const dto = plainToInstance(BulkRoomDto, {
        name: 'Server Room 1',
        tempId: 'temp_room_1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without name', async () => {
      const dto = plainToInstance(BulkRoomDto, {
        tempId: 'temp_room_1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should validate without tempId', async () => {
      const dto = plainToInstance(BulkRoomDto, {
        name: 'Server Room 1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BulkUpsDto', () => {
    it('should validate a valid UPS', async () => {
      const dto = plainToInstance(BulkUpsDto, {
        name: 'UPS-01',
        roomId: 'temp_room_1',
        ip: '192.168.1.100',
        tempId: 'temp_ups_1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without name', async () => {
      const dto = plainToInstance(BulkUpsDto, {
        roomId: 'temp_room_1',
        ip: '192.168.1.100',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with invalid IP', async () => {
      const dto = plainToInstance(BulkUpsDto, {
        name: 'UPS-01',
        ip: 'invalid-ip',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ip');
    });

    it('should validate without optional fields', async () => {
      const dto = plainToInstance(BulkUpsDto, {
        name: 'UPS-01',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('BulkServerDto', () => {
    it('should validate a valid server', async () => {
      const dto = plainToInstance(BulkServerDto, {
        name: 'WEB-01',
        state: 'stopped',
        grace_period_on: 30,
        grace_period_off: 30,
        adminUrl: 'https://192.168.1.10',
        ip: '192.168.1.10',
        login: 'admin',
        password: 'password',
        type: 'esxi',
        priority: 1,
        roomId: 'temp_room_1',
        upsId: 'temp_ups_1',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with ILO configuration', async () => {
      const dto = plainToInstance(BulkServerDto, {
        name: 'WEB-01',
        state: 'stopped',
        grace_period_on: 30,
        grace_period_off: 30,
        adminUrl: 'https://192.168.1.10',
        ip: '192.168.1.10',
        login: 'admin',
        password: 'password',
        type: 'esxi',
        priority: 1,
        ilo_name: 'ILO-WEB-01',
        ilo_ip: '192.168.1.11',
        ilo_login: 'admin',
        ilo_password: 'password',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required fields', async () => {
      const dto = plainToInstance(BulkServerDto, {
        name: 'WEB-01',
      });

      const errors = await validate(dto);
      expect(errors).toBeGreaterThan(0);
      const propertyNames = errors.map((e) => e.property);
      expect(propertyNames).toContain('state');
      expect(propertyNames).toContain('grace_period_on');
      expect(propertyNames).toContain('grace_period_off');
      expect(propertyNames).toContain('adminUrl');
      expect(propertyNames).toContain('ip');
      expect(propertyNames).toContain('login');
      expect(propertyNames).toContain('password');
      expect(propertyNames).toContain('type');
      expect(propertyNames).toContain('priority');
    });
  });

  describe('BulkCreateRequestDto', () => {
    it('should validate a complete bulk create request', async () => {
      const dto = plainToInstance(BulkCreateRequestDto, {
        rooms: [{ name: 'Room 1' }, { name: 'Room 2' }],
        upsList: [
          { name: 'UPS-01', roomId: 'temp_room_1', ip: '192.168.1.100' },
        ],
        servers: [
          {
            name: 'WEB-01',
            state: 'stopped',
            grace_period_on: 30,
            grace_period_off: 30,
            adminUrl: 'https://192.168.1.10',
            ip: '192.168.1.10',
            login: 'admin',
            password: 'password',
            type: 'esxi',
            priority: 1,
            roomId: 'temp_room_1',
            upsId: 'temp_ups_1',
          },
        ],
        idMapping: {
          rooms: { temp_room_1: 'Room 1' },
          ups: { temp_ups_1: 'UPS-01' },
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with empty arrays', async () => {
      const dto = plainToInstance(BulkCreateRequestDto, {
        rooms: [],
        upsList: [],
        servers: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without required arrays', async () => {
      const dto = plainToInstance(BulkCreateRequestDto, {});

      const errors = await validate(dto);
      expect(errors).toBeGreaterThan(0);
      const propertyNames = errors.map((e) => e.property);
      expect(propertyNames).toContain('rooms');
      expect(propertyNames).toContain('upsList');
      expect(propertyNames).toContain('servers');
    });
  });
});
