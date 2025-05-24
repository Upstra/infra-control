import { Ilo } from '../domain/entities/ilo.entity';

export const createMockIlo = (overrides?: Partial<Ilo>): Ilo =>
  Object.assign(new Ilo(), {
    id: 'ilo-1',
    ip: '192.168.1.100',
    ...overrides,
  });
