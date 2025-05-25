import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IloCreationDto } from '../ilo.creation.dto';

describe('IloCreationDto', () => {
  it('should be valid with all required fields', async () => {
    const dto = plainToInstance(IloCreationDto, {
      name: 'iLO-1',
      ip: '10.0.0.1',
      login: 'admin',
      password: 'secret',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if required fields are missing', async () => {
    const dto = plainToInstance(IloCreationDto, { name: 'iLO-1' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'ip')).toBe(true);
    expect(errors.some((e) => e.property === 'login')).toBe(true);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should be invalid if fields are not string', async () => {
    const dto = plainToInstance(IloCreationDto, {
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
