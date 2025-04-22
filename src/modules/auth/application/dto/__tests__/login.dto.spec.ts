import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../login.dto';

describe('LoginDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(LoginDto, {
      identifier: 'john@example.com',
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with missing identifier', async () => {
    const dto = plainToInstance(LoginDto, {
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'identifier')).toBe(true);
  });

  it('should be invalid with missing password', async () => {
    const dto = plainToInstance(LoginDto, {
      identifier: 'john@example.com',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should be invalid with non-string fields', async () => {
    const dto = plainToInstance(LoginDto, {
      identifier: 12345,
      password: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'identifier')).toBe(true);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
