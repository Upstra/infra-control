import { validate } from 'class-validator';
import { UserCreateDto } from '../user.create.dto';

describe('UserCreateDto', () => {
  let dto: UserCreateDto;

  beforeEach(() => {
    dto = new UserCreateDto();
  });

  describe('username validation', () => {
    it('should pass with valid username', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when username is empty', async () => {
      dto.username = '';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });

    it('should fail when username is not a string', async () => {
      (dto as any).username = 123;
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('username');
    });
  });

  describe('firstName validation', () => {
    it('should fail when firstName is empty', async () => {
      dto.username = 'johndoe';
      dto.firstName = '';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('firstName');
    });

    it('should fail when firstName is not a string', async () => {
      dto.username = 'johndoe';
      (dto as any).firstName = 123;
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('firstName');
    });
  });

  describe('lastName validation', () => {
    it('should fail when lastName is empty', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = '';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('lastName');
    });

    it('should fail when lastName is not a string', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      (dto as any).lastName = 123;
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('lastName');
    });
  });

  describe('email validation', () => {
    it('should pass with valid email', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john.doe@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email format', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'invalid-email';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail when email is empty', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = '';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('password validation', () => {
    it('should pass with valid password', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when password is too short', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'Short1!';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail when password is empty', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should pass when password is exactly 8 characters', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'Pass123!';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('roleIds validation', () => {
    it('should pass when roleIds is undefined', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';
      dto.roleIds = undefined;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with empty array', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';
      dto.roleIds = [];

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with valid UUID array', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';
      dto.roleIds = [
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid UUID in array', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';
      dto.roleIds = ['invalid-uuid', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'];

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('roleIds');
    });

    it('should fail when roleIds is not an array', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.password = 'StrongPassword123!';
      (dto as any).roleIds = 'not-an-array';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('roleIds');
    });
  });

  describe('complete DTO validation', () => {
    it('should pass with all required fields and roleIds', async () => {
      dto.username = 'johndoe';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john.doe@example.com';
      dto.password = 'StrongPassword123!';
      dto.roleIds = ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'];

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when multiple fields are invalid', async () => {
      dto.username = '';
      dto.firstName = '';
      dto.lastName = '';
      dto.email = 'invalid-email';
      dto.password = 'short';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(4);
    });

    it('should create DTO with expected default values', () => {
      const newDto = new UserCreateDto();
      expect(newDto.username).toBeUndefined();
      expect(newDto.firstName).toBeUndefined();
      expect(newDto.lastName).toBeUndefined();
      expect(newDto.email).toBeUndefined();
      expect(newDto.password).toBeUndefined();
      expect(newDto.roleIds).toBeUndefined();
    });
  });
});