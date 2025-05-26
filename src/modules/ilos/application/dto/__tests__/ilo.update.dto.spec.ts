import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IloUpdateDto } from '../ilo.update.dto';

describe('IloUpdateDto', () => {
  it('should be valid with all optional fields', async () => {
    const dto = plainToInstance(IloUpdateDto, {
      name: 'iLO-2',
      ip: '10.0.0.2',
      login: 'root',
      password: 'pass',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid with no fields (all optional)', async () => {
    const dto = plainToInstance(IloUpdateDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if fields are not string', async () => {
    const dto = plainToInstance(IloUpdateDto, {
      name: 123,
      ip: false,
      login: [],
      password: {},
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
    expect(errors.some((e) => e.property === 'ip')).toBe(true);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
