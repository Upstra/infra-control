import { validate } from 'class-validator';
import { ResetPasswordWithTokenDto } from '../reset-password-with-token.dto';

describe('ResetPasswordWithTokenDto', () => {
  describe('token validation', () => {
    it('should accept valid token', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'a1b2c3d4e5f6',
        newPassword: 'ValidPassword123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject empty token', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: '',
        newPassword: 'ValidPassword123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('token');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(errors[0].constraints?.isNotEmpty).toBe('Le token est requis');
    });

    it('should reject null token', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: null,
        newPassword: 'ValidPassword123!',
      });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });

    it('should reject undefined token', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: undefined,
        newPassword: 'ValidPassword123!',
      });

      const errors = await validate(dto);

      expect(errors.some((e) => e.property === 'token')).toBe(true);
    });
  });

  describe('newPassword validation', () => {
    it('should accept strong password', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'StrongPassword123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject empty password', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: '',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isNotEmpty');
      expect(passwordErrors[0].constraints?.isNotEmpty).toBe(
        'Le nouveau mot de passe est requis',
      );
    });

    it('should reject password without uppercase', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'weakpassword123!',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
      expect(passwordErrors[0].constraints?.isStrongPassword).toContain(
        '1 majuscule(s)',
      );
    });

    it('should reject password without lowercase', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'WEAKPASSWORD123!',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
      expect(passwordErrors[0].constraints?.isStrongPassword).toContain(
        '1 minuscule(s)',
      );
    });

    it('should reject password without numbers', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'WeakPassword!',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
      expect(passwordErrors[0].constraints?.isStrongPassword).toContain(
        '1 chiffre(s)',
      );
    });

    it('should reject password without symbols', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'WeakPassword123',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
      expect(passwordErrors[0].constraints?.isStrongPassword).toContain(
        '1 symbole(s)',
      );
    });

    it('should reject password shorter than 8 characters', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'Abc1!',
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
      expect(passwordErrors[0].constraints?.isStrongPassword).toContain(
        'au moins 8 caractères',
      );
    });

    it('should accept password with exactly 8 characters meeting all requirements', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'Abcd123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept password with special characters', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: 'Test@Password#123$',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject null password', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: null,
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('should reject undefined password', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: 'validtoken',
        newPassword: undefined,
      });

      const errors = await validate(dto);

      const passwordErrors = errors.filter((e) => e.property === 'newPassword');
      expect(passwordErrors.length).toBeGreaterThan(0);
    });
  });

  describe('multiple field validation', () => {
    it('should reject when both fields are invalid', async () => {
      const dto = Object.assign(new ResetPasswordWithTokenDto(), {
        token: '',
        newPassword: 'weak',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.some((e) => e.property === 'token')).toBe(true);
      expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
    });
  });
});