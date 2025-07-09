import { validate } from 'class-validator';
import { BulkActivateDto } from '../bulk-activate.dto';

describe('BulkActivateDto', () => {
  let dto: BulkActivateDto;

  beforeEach(() => {
    dto = new BulkActivateDto();
  });

  it('should validate with valid UUID array', async () => {
    dto.userIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with single valid UUID', async () => {
    dto.userIds = ['123e4567-e89b-12d3-a456-426614174000'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with empty array', async () => {
    dto.userIds = [];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
    expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
  });

  it('should fail validation without userIds', async () => {
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
  });

  it('should fail validation with non-array userIds', async () => {
    (dto as any).userIds = 'not-an-array';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
    expect(errors[0].constraints).toHaveProperty('isArray');
  });

  it('should fail validation with invalid UUID format', async () => {
    dto.userIds = ['invalid-uuid'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with mixed valid and invalid UUIDs', async () => {
    dto.userIds = [
      '123e4567-e89b-12d3-a456-426614174000',
      'invalid-uuid',
      '123e4567-e89b-12d3-a456-426614174001',
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should fail validation with non-string array elements', async () => {
    (dto as any).userIds = [123, 456];

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should validate with many valid UUIDs', async () => {
    dto.userIds = Array.from(
      { length: 10 },
      (_, i) => `123e4567-e89b-12d3-a456-42661417400${i}`,
    );

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with null userIds', async () => {
    (dto as any).userIds = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
  });

  it('should fail validation with undefined userIds', async () => {
    (dto as any).userIds = undefined;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userIds');
  });

  it('should validate with UUID v4 format specifically', async () => {
    dto.userIds = [
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with UUID v1 format', async () => {
    dto.userIds = ['550e8400-e29b-11d4-a716-446655440000'];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
