import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  RoomResponseDto,
  RoomCreationDto,
} from '@/modules/rooms/application/dto';

describe('RoomResponseDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(RoomResponseDto, {
      id: '7c3dda0a-e6fb-4fd5-a8be-23fd45c77c8c',
      name: 'Salle 1',
      servers: [],
      ups: [],
      serverCount: 0,
      upsCount: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid when id is not uuid', async () => {
    const dto = plainToInstance(RoomResponseDto, {
      id: '1',
      name: 'Salle 1',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('id');
  });

  it('should be invalid with non-string name', async () => {
    const dto = plainToInstance(RoomCreationDto, {
      id: '7c3dda0a-e6fb-4fd5-a8be-23fd45c77c8c',
      name: 12345,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid with empty dto', async () => {
    const dto = plainToInstance(RoomResponseDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
