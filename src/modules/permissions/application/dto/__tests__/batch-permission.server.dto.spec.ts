import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BatchPermissionServerDto } from '../batch-permission.server.dto';
import { PermissionServerDto } from '../permission.server.dto';

describe('BatchPermissionServerDto', () => {
  describe('validation', () => {
    it('should validate a valid BatchPermissionServerDto', async () => {
      const plain = {
        permissions: [
          {
            roleId: '123e4567-e89b-12d3-a456-426614174000',
            serverId: '123e4567-e89b-12d3-a456-426614174001',
            bitmask: 15,
          },
          {
            roleId: '123e4567-e89b-12d3-a456-426614174002',
            serverId: '123e4567-e89b-12d3-a456-426614174003',
            bitmask: 7,
          },
        ],
      };

      const dto = plainToInstance(BatchPermissionServerDto, plain);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty permissions array', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should fail validation with more than 100 permissions', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = Array.from({ length: 101 }, (_, i) => ({
        roleId: '123e4567-e89b-12d3-a456-426614174000',
        serverId: `123e4567-e89b-12d3-a456-42661417${i.toString().padStart(4, '0')}`,
        bitmask: 15,
      }));

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
      expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
    });

    it('should fail validation with invalid permission objects', async () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        {
          roleId: 'not-a-uuid',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        },
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
    });

    it('should fail validation when permissions is not an array', async () => {
      const dto = new BatchPermissionServerDto();
      (dto as any).permissions = 'not-an-array';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when permissions is missing', async () => {
      const dto = new BatchPermissionServerDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
    });
  });

  describe('type transformation', () => {
    it('should transform plain objects to PermissionServerDto instances', () => {
      const dto = new BatchPermissionServerDto();
      dto.permissions = [
        new PermissionServerDto({
          roleId: '123e4567-e89b-12d3-a456-426614174000',
          serverId: '123e4567-e89b-12d3-a456-426614174001',
          bitmask: 15,
        }),
      ];

      expect(dto.permissions[0]).toBeInstanceOf(PermissionServerDto);
    });
  });
});