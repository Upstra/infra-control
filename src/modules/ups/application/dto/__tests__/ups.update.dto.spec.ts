import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpsUpdateDto } from '../ups.update.dto';

describe('UpsUpdateDto', () => {
  it('should validate with partial data', async () => {
    const dto = plainToInstance(UpsUpdateDto, {
      ip: '10.0.0.1',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with all fields', async () => {
    const dto = plainToInstance(UpsUpdateDto, {
      name: 'UPS 1',
      ip: '192.168.1.2',
      login: 'root',
      password: 'rootpass',
      grace_period_on: 15,
      grace_period_off: 5,
      roomId: '2c43bb4c-f39e-4a49-817e-d4c28be83150',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid UUID', async () => {
    const dto = plainToInstance(UpsUpdateDto, {
      roomId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'roomId')).toBe(true);
  });
});
