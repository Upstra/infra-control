import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateGroupUseCase } from '../create-group.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { CreateGroupDto } from '../../dto/create-group.dto';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

describe('CreateGroupUseCase', () => {
  let useCase: CreateGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateGroupUseCase,
        {
          provide: GroupRepository,
          useValue: {
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

    useCase = module.get<CreateGroupUseCase>(CreateGroupUseCase);
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'test-user-id';
    const createGroupDto: CreateGroupDto = {
      name: 'Test Group',
      description: 'Test Description',
      type: GroupType.SERVER,
    };

    it('should create a new group successfully', async () => {
      const mockGroup = new Group();
      mockGroup.id = '123';
      mockGroup.name = createGroupDto.name;
      mockGroup.description = createGroupDto.description;
      mockGroup.type = createGroupDto.type;
      mockGroup.isActive = true;
      mockGroup.createdBy = userId;
      mockGroup.updatedBy = userId;
      mockGroup.createdAt = new Date();
      mockGroup.updatedAt = new Date();

      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockResolvedValue(mockGroup);

      const result = await useCase.execute(createGroupDto, userId);

      expect(groupRepository.existsByName).toHaveBeenCalledWith(
        createGroupDto.name,
      );
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createGroupDto.name,
          description: createGroupDto.description,
          type: createGroupDto.type,
          createdBy: userId,
          updatedBy: userId,
        }),
      );
      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        type: mockGroup.type,
        isActive: mockGroup.isActive,
        createdAt: mockGroup.createdAt,
        updatedAt: mockGroup.updatedAt,
      });
    });

    it('should throw ConflictException when group name already exists', async () => {
      groupRepository.existsByName.mockResolvedValue(true);

      await expect(useCase.execute(createGroupDto, userId)).rejects.toThrow(
        new ConflictException(
          `Group with name "${createGroupDto.name}" already exists`,
        ),
      );

      expect(groupRepository.existsByName).toHaveBeenCalledWith(
        createGroupDto.name,
      );
      expect(groupRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      groupRepository.existsByName.mockRejectedValue(error);

      await expect(useCase.execute(createGroupDto, userId)).rejects.toThrow(
        error,
      );

      expect(groupRepository.existsByName).toHaveBeenCalledWith(
        createGroupDto.name,
      );
      expect(groupRepository.save).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const error = new Error('Save error');
      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockRejectedValue(error);

      await expect(useCase.execute(createGroupDto, userId)).rejects.toThrow(
        error,
      );

      expect(groupRepository.existsByName).toHaveBeenCalledWith(
        createGroupDto.name,
      );
      expect(groupRepository.save).toHaveBeenCalled();
    });
  });

  describe('mapToResponseDto', () => {
    it('should map all group properties correctly', async () => {
      const mockGroup = new Group();
      mockGroup.id = '123';
      mockGroup.name = 'Test Group';
      mockGroup.description = 'Test Description';
      mockGroup.type = GroupType.VM;
      mockGroup.isActive = false;
      mockGroup.createdBy = 'user-id';
      mockGroup.updatedBy = 'user-id';
      mockGroup.createdAt = new Date('2024-01-01');
      mockGroup.updatedAt = new Date('2024-01-02');

      groupRepository.existsByName.mockResolvedValue(false);
      groupRepository.save.mockResolvedValue(mockGroup);

      const result = await useCase.execute(
        {
          name: mockGroup.name,
          description: mockGroup.description,
          type: mockGroup.type,
        },
        'user-id',
      );

      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        type: mockGroup.type,
        isActive: mockGroup.isActive,
        createdAt: mockGroup.createdAt,
        updatedAt: mockGroup.updatedAt,
      });
    });
  });
});
