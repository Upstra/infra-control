import { validate } from 'class-validator';
import { UpdateAccountDto } from '../update-account.dto';

describe('UpdateAccountDto', () => {
  let dto: UpdateAccountDto;

  beforeEach(() => {
    dto = new UpdateAccountDto();
  });

  it('should validate with all valid optional fields', async () => {
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.email = 'john.doe@example.com';
    dto.isActive = true;
    dto.isVerified = true;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with no fields (all optional)', async () => {
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only firstName', async () => {
    dto.firstName = 'John';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only lastName', async () => {
    dto.lastName = 'Doe';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only email', async () => {
    dto.email = 'john.doe@example.com';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only isActive', async () => {
    dto.isActive = false;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with only isVerified', async () => {
    dto.isVerified = false;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with non-string firstName', async () => {
    (dto as any).firstName = 123;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('firstName');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with non-string lastName', async () => {
    (dto as any).lastName = 123;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('lastName');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation with non-boolean isActive', async () => {
    (dto as any).isActive = 'true';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('isActive');
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });

  it('should fail validation with non-boolean isVerified', async () => {
    (dto as any).isVerified = 'false';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('isVerified');
    expect(errors[0].constraints).toHaveProperty('isBoolean');
  });

  it('should validate with multiple valid fields', async () => {
    dto.firstName = 'John';
    dto.email = 'john@example.com';
    dto.isActive = true;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with multiple invalid fields', async () => {
    (dto as any).firstName = 123;
    dto.email = 'invalid-email';
    (dto as any).isActive = 'not-boolean';

    const errors = await validate(dto);
    expect(errors).toHaveLength(3);
    const propertyNames = errors.map((e) => e.property).sort();
    expect(propertyNames).toEqual(['email', 'firstName', 'isActive']);
  });
});
