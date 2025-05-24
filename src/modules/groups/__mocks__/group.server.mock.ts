import { GroupServer } from '../domain/entities/group.server.entity';

export const createMockGroupServer = (
  overrides?: Partial<GroupServer>,
): GroupServer => {
  const base: Partial<GroupServer> = {
    id: 'group-123',
    name: 'Groupe Serveur',
    priority: 1,
    servers: [],
    ...overrides,
  };
  const group = Object.assign(new GroupServer(), base);
  return group;
};
