import { Room } from '../domain/entities/room.entity';

export const createMockRoom = (overrides?: Partial<Room>): Room =>
  Object.assign(new Room(), {
    id: 'room-1',
    name: 'Salle Serveur',
    servers: [],
    ...overrides,
  });
