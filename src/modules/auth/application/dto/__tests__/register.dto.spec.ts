import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../register.dto';

describe('RegisterDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john_doe',
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with weak password', async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'john_doe',
      password: 'weak',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should be invalid with invalid email', async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      username: 'john_doe',
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
