import { GroupServer } from '../domain/entities/group.server.entity';

export const mockGroupServer = (
  overrides?: Partial<GroupServer>,
): GroupServer => {
  const base: Partial<GroupServer> = {
    id: 'group-123',
    name: 'Serveur critique',
    priority: 1,
    servers: [],
    ...overrides,
  };
  const group = Object.setPrototypeOf(base, GroupServer.prototype);
  return group as GroupServer;
};
