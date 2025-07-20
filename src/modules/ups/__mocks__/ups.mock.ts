import { UpsCreationDto } from '../application/dto/ups.creation.dto';
import { Ups } from '../domain/entities/ups.entity';

export const createMockUps = (overrides?: Partial<Ups>): Ups =>
  Object.assign(new Ups(), {
    id: 'ups-1',
    name: 'Onduleur',
    ip: '192.168.1.50',
    grace_period_on: 30,
    grace_period_off: 10,
    roomId: 'room-1',
    servers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

export const createMockUpsDto = (
  overrides?: Partial<UpsCreationDto>,
): UpsCreationDto => ({
  name: 'Onduleur Test',
  ip: '192.168.1.50',
  grace_period_on: 30,
  grace_period_off: 10,
  roomId: 'room-uuid',
  ...overrides,
});
