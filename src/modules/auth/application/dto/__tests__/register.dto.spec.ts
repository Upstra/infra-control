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

  describe('firstName validation', () => {
    it('should be valid with accented characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'François',
        lastName: 'Doe',
        email: 'francois.doe@example.com',
        username: 'francois',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should be valid with hyphens', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'Marie-Claire',
        lastName: 'Doe',
        email: 'marie.doe@example.com',
        username: 'marie_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should be invalid with emojis', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'John😀',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const firstNameError = errors.find(
        (error) => error.property === 'firstName',
      );
      expect(firstNameError).toBeDefined();
    });

    it('should be invalid with special characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'John@',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const firstNameError = errors.find(
        (error) => error.property === 'firstName',
      );
      expect(firstNameError).toBeDefined();
    });

    it('should be invalid when too short', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'J',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const firstNameError = errors.find(
        (error) => error.property === 'firstName',
      );
      expect(firstNameError).toBeDefined();
    });

    it('should be invalid when too long', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'J'.repeat(16),
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const firstNameError = errors.find(
        (error) => error.property === 'firstName',
      );
      expect(firstNameError).toBeDefined();
    });
  });

  describe('lastName validation', () => {
    it('should be valid with accented characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'John',
        lastName: 'Müller',
        email: 'john.muller@example.com',
        username: 'johnm',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should be invalid with emojis', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'John',
        lastName: 'Doe🎉',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const lastNameError = errors.find(
        (error) => error.property === 'lastName',
      );
      expect(lastNameError).toBeDefined();
    });

    it('should be invalid with special characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        firstName: 'John',
        lastName: 'Doe#',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const lastNameError = errors.find(
        (error) => error.property === 'lastName',
      );
      expect(lastNameError).toBeDefined();
    });
  });
});
