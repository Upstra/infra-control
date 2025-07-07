import { validate } from 'class-validator';
import { ToggleUserStatusDto } from '../toggle-user-status.dto';

describe('ToggleUserStatusDto', () => {
  let dto: ToggleUserStatusDto;

  beforeEach(() => {
    dto = new ToggleUserStatusDto();
  });

  describe('userId', () => {
    it('should validate with a valid UUID', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with an invalid UUID', async () => {
      dto.userId = 'invalid-uuid';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation when userId is empty', async () => {
      dto.userId = '';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when userId is undefined', async () => {
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when userId is null', async () => {
      dto.userId = null as any;
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when userId is a number', async () => {
      dto.userId = 123 as any;
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });
  });

  describe('reason', () => {
    it('should validate with a string reason', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'User requested reactivation';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate without a reason (optional)', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with an empty string reason', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when reason is a number', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 123 as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when reason is an object', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = { text: 'reason' } as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when reason is an array', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = ['reason'] as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate with a long reason string', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'A'.repeat(500);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when reason is null', async () => {
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
