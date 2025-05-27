import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpsCreationDto } from '../ups.creation.dto';

describe('UpsCreationDto', () => {
  it('should validate with correct data', async () => {
    const dto = plainToInstance(UpsCreationDto, {
      name: 'Onduleur',
      ip: '192.168.0.10',
      login: 'admin',
      password: 'pass',
      grace_period_on: 10,
      grace_period_off: 5,
      roomId: '2c43bb4c-f39e-4a49-817e-d4c28be83150',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with missing fields', async () => {
    const dto = plainToInstance(UpsCreationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid roomId UUID', async () => {
    const dto = plainToInstance(UpsCreationDto, {
      ...validData,
      roomId: 'invalid-uuid',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'roomId')).toBe(true);
  });

  const validData = {
    name: 'Onduleur',
    ip: '192.168.0.10',
    login: 'admin',
    password: 'pass',
    grace_period_on: 10,
    grace_period_off: 5,
    roomId: '2c43bb4c-f39e-4a49-817e-d4c28be83150',
  };
});
