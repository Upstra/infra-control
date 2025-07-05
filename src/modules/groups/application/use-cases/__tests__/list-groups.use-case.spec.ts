import { Test, TestingModule } from '@nestjs/testing';
import { ListGroupsUseCase } from '../list-groups.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { GroupQueryDto } from '../../dto/group-query.dto';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';

describe('ListGroupsUseCase', () => {
  let useCase: ListGroupsUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListGroupsUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findAllPaginated: jest.fn(),
            findAllPaginatedWithCounts: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ListGroupsUseCase>(ListGroupsUseCase);
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const createMockGroup = (
      id: string,
      name: string,
      type: GroupType,
    ): any => {
      const group = new Group();
      group.id = id;
      group.name = name;
      group.description = `Description for ${name}`;
      group.type = type;
      group.isActive = true;
      group.createdAt = new Date('2024-01-01');
      group.updatedAt = new Date('2024-01-02');
      // Add counts for GroupWithCounts
      return {
        ...group,
        serverCount: type === GroupType.SERVER ? 2 : 0,
        vmCount: type === GroupType.VM ? 3 : 0,
      };
    };

    it('should return paginated groups with default parameters', async () => {
      const mockGroups = [
        createMockGroup('1', 'Group 1', GroupType.SERVER),
        createMockGroup('2', 'Group 2', GroupType.VM),
      ];

      const mockResult = {
        data: mockGroups,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = {};
      const result = await useCase.execute(query);

      expect(groupRepository.findAllPaginatedWithCounts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: undefined,
        search: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(result.data[0]).toEqual({
        id: '1',
        name: 'Group 1',
        description: 'Description for Group 1',
        type: GroupType.SERVER,
        isActive: true,
        createdAt: mockGroups[0].createdAt,
        updatedAt: mockGroups[0].updatedAt,
        serverCount: 2,
        vmCount: undefined,
      });
    });

    it('should handle custom pagination parameters', async () => {
      const mockGroups = Array.from({ length: 5 }, (_, i) =>
        createMockGroup(`${i + 1}`, `Group ${i + 1}`, GroupType.SERVER),
      );

      const mockResult = {
        data: mockGroups.slice(0, 2),
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = { page: 2, limit: 2 };
      const result = await useCase.execute(query);

      expect(groupRepository.findAllPaginatedWithCounts).toHaveBeenCalledWith({
        page: 2,
        limit: 2,
        type: undefined,
        search: undefined,
      });

      expect(result.meta).toEqual({
        total: 5,
        page: 2,
        limit: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should filter by group type', async () => {
      const mockGroups = [
        createMockGroup('1', 'VM Group 1', GroupType.VM),
        createMockGroup('2', 'VM Group 2', GroupType.VM),
      ];

      const mockResult = {
        data: mockGroups,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = { type: GroupType.VM };
      const result = await useCase.execute(query);

      expect(groupRepository.findAllPaginatedWithCounts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: GroupType.VM,
        search: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every((g) => g.type === GroupType.VM)).toBe(true);
    });

    it('should handle search parameter', async () => {
      const mockGroups = [
        createMockGroup('1', 'Production Servers', GroupType.SERVER),
      ];

      const mockResult = {
        data: mockGroups,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = { search: 'Production' };
      const result = await useCase.execute(query);

      expect(groupRepository.findAllPaginatedWithCounts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: undefined,
        search: 'Production',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Production Servers');
    });

    it('should combine multiple query parameters', async () => {
      const mockGroups = [createMockGroup('1', 'Test VM Group', GroupType.VM)];

      const mockResult = {
        data: mockGroups,
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = {
        page: 1,
        limit: 5,
        type: GroupType.VM,
        search: 'Test',
      };

      const result = await useCase.execute(query);

      expect(groupRepository.findAllPaginatedWithCounts).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
        type: GroupType.VM,
        search: 'Test',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should return empty data when no groups found', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = { search: 'NonExistent' };
      const result = await useCase.execute(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      groupRepository.findAllPaginatedWithCounts.mockRejectedValue(error);

      const query: GroupQueryDto = {};

      await expect(useCase.execute(query)).rejects.toThrow(error);
    });

    it('should correctly map inactive groups', async () => {
      const inactiveGroup = createMockGroup(
        '1',
        'Inactive Group',
        GroupType.SERVER,
      );
      inactiveGroup.isActive = false;

      const mockResult = {
        data: [inactiveGroup],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = {};
      const result = await useCase.execute(query);

      expect(result.data[0].isActive).toBe(false);
    });

    it('should handle groups with null descriptions', async () => {
      const groupWithNullDesc = createMockGroup('1', 'Group', GroupType.SERVER);
      groupWithNullDesc.description = null;

      const mockResult = {
        data: [groupWithNullDesc],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = {};
      const result = await useCase.execute(query);

      expect(result.data[0].description).toBeNull();
    });

    it('should calculate pagination metadata correctly for last page', async () => {
      const mockGroups = [createMockGroup('1', 'Group 1', GroupType.SERVER)];

      const mockResult = {
        data: mockGroups,
        total: 21,
        page: 3,
        limit: 10,
        totalPages: 3,
      };

      groupRepository.findAllPaginatedWithCounts.mockResolvedValue(mockResult);

      const query: GroupQueryDto = { page: 3, limit: 10 };
      const result = await useCase.execute(query);

      expect(result.meta).toEqual({
        total: 21,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });
});
