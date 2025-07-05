import { Group } from '../domain/entities/group.entity';
import { GroupType } from '../domain/enums/group-type.enum';

export const createMockGroup = (partial?: Partial<Group>): Group => {
  const group = new Group();
  group.id = partial?.id ?? 'group-123';
  group.name = partial?.name ?? 'Test Group';
  group.description = partial?.description ?? 'Test group description';
  group.type = partial?.type ?? GroupType.SERVER;
  group.isActive = partial?.isActive ?? true;
  group.createdAt = partial?.createdAt ?? new Date();
  group.updatedAt = partial?.updatedAt ?? new Date();
  group.createdBy = partial?.createdBy ?? 'user-123';
  group.updatedBy = partial?.updatedBy ?? 'user-123';

  return group;
};

export const createMockGroups = (count: number = 3): Group[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockGroup({
      id: `group-${i + 1}`,
      name: `Group ${i + 1}`,
      description: `Description for group ${i + 1}`,
      type: i % 2 === 0 ? GroupType.SERVER : GroupType.VM,
    }),
  );
};
