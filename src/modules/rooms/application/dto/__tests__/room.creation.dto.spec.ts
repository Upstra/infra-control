import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RoomCreationDto } from '@/modules/rooms/application/dto';

describe('RoomCreationDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(RoomCreationDto, {
      name: 'Salle 1',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with empty dto', async () => {
    const dto = plainToInstance(RoomCreationDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid with non-string name', async () => {
    const dto = plainToInstance(RoomCreationDto, {
      name: 12345,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
