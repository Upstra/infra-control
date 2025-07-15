import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ValidationRequestDto,
  ValidationResponseDto,
  ValidationErrorDto,
  ValidationWarningDto,
  UpsConnectivityResultDto,
  ServerConnectivityResultDto,
} from '../validation.dto';

describe('ValidationDto', () => {
  describe('ValidationRequestDto', () => {
    it('should validate a valid validation request', async () => {
      const dto = plainToInstance(ValidationRequestDto, {
        resources: {
          rooms: [{ name: 'Room 1' }],
          upsList: [{ name: 'UPS-01', ip: '192.168.1.100', grace_period_on: 30, grace_period_off: 30 }],
          servers: [
            {
              name: 'WEB-01',
              state: 'stopped',
              adminUrl: 'https://192.168.1.10',
              ip: '192.168.1.10',
              login: 'admin',
              password: 'password',
              type: 'esxi',
              priority: 1,
            },
          ],
        },
        checkConnectivity: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate without checkConnectivity', async () => {
      const dto = plainToInstance(ValidationRequestDto, {
        resources: {
          rooms: [],
          upsList: [],
          servers: [],
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation without resources', async () => {
      const dto = plainToInstance(ValidationRequestDto, {
        checkConnectivity: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('resources');
    });
  });

  describe('ValidationErrorDto', () => {
    it('should validate a valid error', async () => {
      const dto = plainToInstance(ValidationErrorDto, {
        resource: 'room',
        index: 0,
        field: 'name',
        message: 'Name is required',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid resource type', async () => {
      const dto = plainToInstance(ValidationErrorDto, {
        resource: 'invalid',
        index: 0,
        field: 'name',
        message: 'Error',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('resource');
    });
  });

  describe('ValidationWarningDto', () => {
    it('should validate a valid warning', async () => {
      const dto = plainToInstance(ValidationWarningDto, {
        resource: 'ups',
        index: 1,
        message: 'UPS capacity is low',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ConnectivityResultDto', () => {
    it('should validate UPS connectivity results', async () => {
      const dto = plainToInstance(UpsConnectivityResultDto, {
        index: 0,
        ip: '192.168.1.100',
        accessible: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate server connectivity results', async () => {
      const dto = plainToInstance(ServerConnectivityResultDto, {
        index: 0,
        ip: '192.168.1.10',
        accessible: true,
        iloIp: '192.168.1.11',
        iloAccessible: false,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ValidationResponseDto', () => {
    it('should validate a complete validation response', async () => {
      const dto = plainToInstance(ValidationResponseDto, {
        valid: true,
        errors: [],
        warnings: [
          {
            resource: 'room',
            index: 0,
            message: 'Room capacity is small',
          },
        ],
        connectivityResults: {
          ups: [
            {
              index: 0,
              ip: '192.168.1.100',
              accessible: true,
            },
          ],
          servers: [
            {
              index: 0,
              ip: '192.168.1.10',
              accessible: true,
            },
          ],
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate without connectivity results', async () => {
      const dto = plainToInstance(ValidationResponseDto, {
        valid: false,
        errors: [
          {
            resource: 'server',
            index: 0,
            field: 'ip',
            message: 'Invalid IP address',
          },
        ],
        warnings: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
