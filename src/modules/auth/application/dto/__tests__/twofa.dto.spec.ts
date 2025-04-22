import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TwoFADto } from '../twofa.dto';

describe('TwoFADto', () => {
  it('should be valid with a code', async () => {
    const dto = plainToInstance(TwoFADto, {
      code: '123456',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with empty code', async () => {
    const dto = plainToInstance(TwoFADto, {
      code: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('code');
  });

  it('should be invalid with non-string code', async () => {
    const dto = plainToInstance(TwoFADto, {
      code: 123456, // number au lieu de string
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('code');
  });
});
