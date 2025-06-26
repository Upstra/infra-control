import { Room } from '@/modules/rooms/domain/entities/room.entity';
import { v4 as uuidv4 } from 'uuid';

export const mockRoom = (overrides?: Partial<Room>): Room =>
  Object.assign(new Room(), {
    id: uuidv4().toString(),
    name: 'Test Room',
    servers: [],
    ups: [],
    ...overrides,
  });
