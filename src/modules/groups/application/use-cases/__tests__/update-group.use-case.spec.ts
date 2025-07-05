import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateGroupUseCase } from '../update-group.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { UpdateGroupDto } from '../../dto/update-group.dto';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

describe('UpdateGroupUseCase', () => {
  let useCase: UpdateGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateGroupUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findById: jest.fn(),
            existsByName: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateGroupUseCase>(UpdateGroupUseCase);
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const groupId = 'test-group-id';
    const userId = 'test-user-id';

    const createMockGroup = (): Group => {
      const group = new Group();
      group.id = groupId;
      group.name = 'Original Name';
      group.description = 'Original Description';
      group.type = GroupType.SERVER;
      group.isActive = true;
      group.createdBy = 'creator-id';
      group.updatedBy = 'creator-id';
      group.createdAt = new Date('2024-01-01');
      group.updatedAt = new Date('2024-01-01');
      return group;
    };

    it('should throw NotFoundException when group does not exist', async () => {
      groupRepository.findById.mockResolvedValue(null);

      const dto: UpdateGroupDto = { name: 'New Name' };

      await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
        new NotFoundException(`Group with id "${groupId}" not found`),
      );

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.save).not.toHaveBeenCalled();
    });

    it('should update group name successfully', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = {
        ...mockGroup,
        name: 'New Name',
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = { name: 'New Name' };
      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.existsByName).toHaveBeenCalledWith('New Name');
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: groupId,
          name: 'New Name',
          updatedBy: userId,
        }),
      );
      expect(result.name).toBe('New Name');
    });

    it('should throw ConflictException when new name already exists', async () => {
      const mockGroup = createMockGroup();

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.existsByName.mockResolvedValue(true);

      const dto: UpdateGroupDto = { name: 'Existing Name' };

      await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
        new ConflictException(`Group with name "Existing Name" already exists`),
      );

      expect(groupRepository.existsByName).toHaveBeenCalledWith(
        'Existing Name',
      );
      expect(groupRepository.save).not.toHaveBeenCalled();
    });

    it('should not check name existence when name is unchanged', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = {
        ...mockGroup,
        description: 'New Description',
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = {
        name: 'Original Name',
        description: 'New Description',
      };

      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.existsByName).not.toHaveBeenCalled();
      expect(groupRepository.save).toHaveBeenCalled();
      expect(result.description).toBe('New Description');
    });

    it('should update description only', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = {
        ...mockGroup,
        description: 'New Description',
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = { description: 'New Description' };
      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.existsByName).not.toHaveBeenCalled();
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New Description',
          updatedBy: userId,
        }),
      );
      expect(result.description).toBe('New Description');
    });

    it('should update isActive status', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = { ...mockGroup, isActive: false, updatedBy: userId };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = { isActive: false };
      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          updatedBy: userId,
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = {
        ...mockGroup,
        name: 'New Name',
        description: 'New Description',
        isActive: false,
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = {
        name: 'New Name',
        description: 'New Description',
        isActive: false,
      };

      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          description: 'New Description',
          isActive: false,
          updatedBy: userId,
        }),
      );
      expect(result).toEqual({
        id: groupId,
        name: 'New Name',
        description: 'New Description',
        type: GroupType.SERVER,
        isActive: false,
        createdAt: mockGroup.createdAt,
        updatedAt: mockGroup.updatedAt,
      });
    });

    it('should handle empty update dto', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = { ...mockGroup, updatedBy: userId };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = {};
      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.existsByName).not.toHaveBeenCalled();
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedBy: userId,
        }),
      );
      expect(result.name).toBe('Original Name');
    });

    it('should handle repository save errors', async () => {
      const mockGroup = createMockGroup();
      const error = new Error('Save failed');

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockRejectedValue(error);

      const dto: UpdateGroupDto = { name: 'New Name' };

      await expect(useCase.execute(groupId, dto, userId)).rejects.toThrow(
        error,
      );
    });

    it('should preserve type field during update', async () => {
      const mockGroup = createMockGroup();
      mockGroup.type = GroupType.VM;
      const updatedGroup = {
        ...mockGroup,
        name: 'New Name',
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = { name: 'New Name' };
      const result = await useCase.execute(groupId, dto, userId);

      expect(result.type).toBe(GroupType.VM);
    });

    it('should update description to null', async () => {
      const mockGroup = createMockGroup();
      const updatedGroup = {
        ...mockGroup,
        description: null,
        updatedBy: userId,
      };

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const dto: UpdateGroupDto = { description: null };
      const result = await useCase.execute(groupId, dto, userId);

      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          updatedBy: userId,
        }),
      );
      expect(result.description).toBeNull();
    });
  });
});
