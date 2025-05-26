import { Ups } from '../domain/entities/ups.entity';

export const createMockUps = (overrides?: Partial<Ups>): Ups =>
  Object.assign(new Ups(), {
    id: 'ups-1',
    name: 'Onduleur',
    servers: [],
    ...overrides,
  });
