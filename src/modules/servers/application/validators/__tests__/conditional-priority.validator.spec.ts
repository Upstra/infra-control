import { validate } from 'class-validator';
import { IsConditionalPriority } from '../conditional-priority.validator';

class TestServerDto {
  @IsConditionalPriority()
  priority?: number;

  type!: string;
}

describe('IsConditionalPriority', () => {
  let testDto: TestServerDto;

  beforeEach(() => {
    testDto = new TestServerDto();
  });

  describe('for vCenter servers', () => {
    beforeEach(() => {
      testDto.type = 'vcenter';
    });

    it('should pass validation when priority is not provided', async () => {
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when priority is null', async () => {
      testDto.priority = null as any;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when priority is undefined', async () => {
      testDto.priority = undefined;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when priority is a valid number', async () => {
      testDto.priority = 10;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when priority is invalid (0)', async () => {
      testDto.priority = 0;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority must be a number between 1 and 999 if provided',
      );
    });

    it('should fail validation when priority is invalid (1000)', async () => {
      testDto.priority = 1000;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority must be a number between 1 and 999 if provided',
      );
    });

    it('should fail validation when priority is not a number', async () => {
      testDto.priority = 'not-a-number' as any;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority must be a number between 1 and 999 if provided',
      );
    });

    it('should fail validation when priority is a decimal', async () => {
      testDto.priority = 10.5;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority must be a number between 1 and 999 if provided',
      );
    });
  });

  describe('for non-vCenter servers', () => {
    beforeEach(() => {
      testDto.type = 'esxi';
    });

    it('should fail validation when priority is not provided', async () => {
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should fail validation when priority is null', async () => {
      testDto.priority = null as any;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should fail validation when priority is undefined', async () => {
      testDto.priority = undefined;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should pass validation when priority is a valid number', async () => {
      testDto.priority = 10;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with boundary values (1)', async () => {
      testDto.priority = 1;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with boundary values (999)', async () => {
      testDto.priority = 999;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when priority is invalid (0)', async () => {
      testDto.priority = 0;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should fail validation when priority is invalid (1000)', async () => {
      testDto.priority = 1000;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should fail validation when priority is not a number', async () => {
      testDto.priority = 'not-a-number' as any;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should fail validation when priority is a decimal', async () => {
      testDto.priority = 10.5;
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });
  });

  describe('for other server types', () => {
    it('should require priority for vmware servers', async () => {
      testDto.type = 'vmware';
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });

    it('should require priority for unknown server types', async () => {
      testDto.type = 'unknown';
      const errors = await validate(testDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isConditionalPriority).toBe(
        'Priority is required and must be a number between 1 and 999',
      );
    });
  });
});
