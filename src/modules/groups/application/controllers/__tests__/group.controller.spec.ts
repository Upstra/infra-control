import { Test, TestingModule } from '@nestjs/testing';
import { GroupController } from '../group.controller';
import { CreateGroupUseCase } from '../../use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../../use-cases/update-group.use-case';
import { DeleteGroupUseCase } from '../../use-cases/delete-group.use-case';
import { GetGroupUseCase } from '../../use-cases/get-group.use-case';
import { ListGroupsUseCase } from '../../use-cases/list-groups.use-case';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { GroupQueryDto } from '../../dto/group-query.dto';
import { GroupType } from '../../../domain/enums/group-type.enum';

describe('GroupController', () => {
  let controller: GroupController;
  let createGroupUseCase: jest.Mocked<CreateGroupUseCase>;
  let updateGroupUseCase: jest.Mocked<UpdateGroupUseCase>;
  let deleteGroupUseCase: jest.Mocked<DeleteGroupUseCase>;
  let getGroupUseCase: jest.Mocked<GetGroupUseCase>;
  let listGroupsUseCase: jest.Mocked<ListGroupsUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: CreateGroupUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateGroupUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteGroupUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetGroupUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ListGroupsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    createGroupUseCase = module.get(CreateGroupUseCase);
    updateGroupUseCase = module.get(UpdateGroupUseCase);
    deleteGroupUseCase = module.get(DeleteGroupUseCase);
    getGroupUseCase = module.get(GetGroupUseCase);
    listGroupsUseCase = module.get(ListGroupsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated groups', async () => {
      const query: GroupQueryDto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [
          {
            id: '1',
            name: 'Group 1',
            description: 'Description 1',
            type: GroupType.SERVER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      listGroupsUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.list(query);

      expect(listGroupsUseCase.execute).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should pass empty query object when no parameters provided', async () => {
      const query: GroupQueryDto = {};
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      listGroupsUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.list(query);

      expect(listGroupsUseCase.execute).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should pass filter parameters correctly', async () => {
      const query: GroupQueryDto = {
        page: 2,
        limit: 20,
        type: GroupType.VM,
        search: 'test',
      };
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      listGroupsUseCase.execute.mockResolvedValue(mockResponse);

      await controller.list(query);

      expect(listGroupsUseCase.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        type: GroupType.VM,
        search: 'test',
      });
    });
  });

  describe('get', () => {
    it('should return a group by id', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const mockGroup = {
        id: groupId,
        name: 'Test Group',
        description: 'Test Description',
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getGroupUseCase.execute.mockResolvedValue(mockGroup);

      const result = await controller.get(groupId);

      expect(getGroupUseCase.execute).toHaveBeenCalledWith(groupId);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const dto: CreateGroupDto = {
        name: 'New Group',
        description: 'New Description',
        type: GroupType.VM,
      };
      const user = { id: 'user-123' };
      const mockCreatedGroup = {
        id: 'new-group-id',
        ...dto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createGroupUseCase.execute.mockResolvedValue(mockCreatedGroup);

      const result = await controller.create(dto, user);

      expect(createGroupUseCase.execute).toHaveBeenCalledWith(dto, user.id);
      expect(result).toEqual(mockCreatedGroup);
    });

    it('should handle creation without description', async () => {
      const dto: CreateGroupDto = {
        name: 'No Description Group',
        type: GroupType.SERVER,
      };
      const user = { id: 'user-456' };
      const mockCreatedGroup = {
        id: 'new-group-id',
        name: dto.name,
        description: null,
        type: dto.type,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createGroupUseCase.execute.mockResolvedValue(mockCreatedGroup);

      const result = await controller.create(dto, user);

      expect(createGroupUseCase.execute).toHaveBeenCalledWith(dto, user.id);
      expect(result.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateGroupDto = {
        name: 'Updated Name',
        description: 'Updated Description',
      };
      const user = { id: 'user-123' };
      const mockUpdatedGroup = {
        id: groupId,
        name: 'Updated Name',
        description: 'Updated Description',
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateGroupUseCase.execute.mockResolvedValue(mockUpdatedGroup);

      const result = await controller.update(groupId, dto, user);

      expect(updateGroupUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
      expect(result).toEqual(mockUpdatedGroup);
    });

    it('should update only isActive status', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateGroupDto = {
        isActive: false,
      };
      const user = { id: 'user-789' };
      const mockUpdatedGroup = {
        id: groupId,
        name: 'Existing Name',
        description: 'Existing Description',
        type: GroupType.VM,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateGroupUseCase.execute.mockResolvedValue(mockUpdatedGroup);

      const result = await controller.update(groupId, dto, user);

      expect(updateGroupUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
      expect(result.isActive).toBe(false);
    });

    it('should handle empty update dto', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateGroupDto = {};
      const user = { id: 'user-999' };
      const mockUpdatedGroup = {
        id: groupId,
        name: 'Unchanged Name',
        description: 'Unchanged Description',
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateGroupUseCase.execute.mockResolvedValue(mockUpdatedGroup);

      await controller.update(groupId, dto, user);

      expect(updateGroupUseCase.execute).toHaveBeenCalledWith(
        groupId,
        dto,
        user.id,
      );
    });
  });

  describe('delete', () => {
    it('should delete a group', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      const user = { id: 'user-123' };

      deleteGroupUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.delete(groupId, user);

      expect(deleteGroupUseCase.execute).toHaveBeenCalledWith(groupId, user.id);
      expect(result).toBeUndefined();
    });

    it('should handle multiple delete calls', async () => {
      const groupId1 = '123e4567-e89b-12d3-a456-426614174001';
      const groupId2 = '123e4567-e89b-12d3-a456-426614174002';
      const user = { id: 'user-123' };

      deleteGroupUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(groupId1, user);
      await controller.delete(groupId2, user);

      expect(deleteGroupUseCase.execute).toHaveBeenCalledTimes(2);
      expect(deleteGroupUseCase.execute).toHaveBeenNthCalledWith(
        1,
        groupId1,
        user.id,
      );
      expect(deleteGroupUseCase.execute).toHaveBeenNthCalledWith(
        2,
        groupId2,
        user.id,
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from use cases', async () => {
      const error = new Error('Use case error');

      getGroupUseCase.execute.mockRejectedValue(error);
      createGroupUseCase.execute.mockRejectedValue(error);
      updateGroupUseCase.execute.mockRejectedValue(error);
      deleteGroupUseCase.execute.mockRejectedValue(error);
      listGroupsUseCase.execute.mockRejectedValue(error);

      await expect(controller.get('some-id')).rejects.toThrow(error);
      await expect(
        controller.create({} as CreateGroupDto, { id: 'user' }),
      ).rejects.toThrow(error);
      await expect(
        controller.update('some-id', {}, { id: 'user' }),
      ).rejects.toThrow(error);
      await expect(
        controller.delete('some-id', { id: 'user' }),
      ).rejects.toThrow(error);
      await expect(controller.list({})).rejects.toThrow(error);
    });
  });
});
