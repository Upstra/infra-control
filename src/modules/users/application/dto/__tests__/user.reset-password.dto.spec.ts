import 'reflect-metadata';
import { validate } from 'class-validator';
import { ResetPasswordDto } from '../user.reset-password.dto';

describe('ResetPasswordDto', () => {
  it('should be valid with a strong password', async () => {
    const dto = new ResetPasswordDto();
    (dto as any).newPassword = 'Test@2024';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with weak password', async () => {
    const dto = new ResetPasswordDto();
    (dto as any).newPassword = 'weakpass';
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isStrongPassword');
  });

  it('should fail with short password', async () => {
    const dto = new ResetPasswordDto();
    (dto as any).newPassword = 'T@st1'; // Trop court
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isStrongPassword');
  });
});
