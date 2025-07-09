import { validate } from 'class-validator';
import { ForgotPasswordDto } from '../forgot-password.dto';

describe('ForgotPasswordDto', () => {
  describe('email validation', () => {
    it('should accept valid email', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'test@example.com',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject empty email', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(errors[0].constraints?.isNotEmpty).toBe(
        "L'adresse email est requise",
      );
    });

    it('should reject invalid email format', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'invalid-email',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[0].constraints?.isEmail).toBe(
        "L'adresse email n'est pas valide",
      );
    });

    it('should reject email with spaces', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'test @example.com',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should reject email without domain', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'test@',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should reject email without @ symbol', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'testexample.com',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should accept email with subdomain', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'test@mail.example.com',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept email with plus sign', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: 'test+tag@example.com',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject null email', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: null,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject undefined email', async () => {
      const dto = Object.assign(new ForgotPasswordDto(), {
        email: undefined,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});