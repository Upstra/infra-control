import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteGroupUseCase } from '../delete-group.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

describe('DeleteGroupUseCase', () => {
  let useCase: DeleteGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteGroupUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findById: jest.fn(),
            delete: jest.fn(),
            deleteWithTransaction: jest.fn(),
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

    useCase = module.get<DeleteGroupUseCase>(DeleteGroupUseCase);
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const groupId = 'test-group-id';
    const userId = 'test-user-id';

    it('should delete an existing group successfully', async () => {
      const mockGroup = new Group();
      mockGroup.id = groupId;
      mockGroup.name = 'Test Group';
      mockGroup.type = GroupType.SERVER;

      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.deleteWithTransaction.mockResolvedValue(undefined);

      await useCase.execute(groupId, userId);

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.deleteWithTransaction).toHaveBeenCalledWith(
        groupId,
      );
    });

    it('should throw NotFoundException when group does not exist', async () => {
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId, userId)).rejects.toThrow(
        new NotFoundException(`Group with id "${groupId}" not found`),
      );

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.deleteWithTransaction).not.toHaveBeenCalled();
    });

    it('should handle repository findById errors', async () => {
      const error = new Error('Database error');
      groupRepository.findById.mockRejectedValue(error);

      await expect(useCase.execute(groupId, userId)).rejects.toThrow(error);

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.deleteWithTransaction).not.toHaveBeenCalled();
    });

    it('should handle repository delete errors', async () => {
      const mockGroup = new Group();
      mockGroup.id = groupId;
      mockGroup.name = 'Test Group';

      const error = new Error('Delete error');
      groupRepository.findById.mockResolvedValue(mockGroup);
      groupRepository.deleteWithTransaction.mockRejectedValue(error);

      await expect(useCase.execute(groupId, userId)).rejects.toThrow(error);

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
      expect(groupRepository.deleteWithTransaction).toHaveBeenCalledWith(
        groupId,
      );
    });

    it('should handle multiple group ids correctly', async () => {
      const groupId1 = 'group-1';
      const groupId2 = 'group-2';

      const mockGroup1 = new Group();
      mockGroup1.id = groupId1;

      const mockGroup2 = new Group();
      mockGroup2.id = groupId2;

      groupRepository.findById
        .mockResolvedValueOnce(mockGroup1)
        .mockResolvedValueOnce(mockGroup2);
      groupRepository.deleteWithTransaction.mockResolvedValue(undefined);

      await useCase.execute(groupId1, userId);
      await useCase.execute(groupId2, userId);

      expect(groupRepository.findById).toHaveBeenCalledTimes(2);
      expect(groupRepository.findById).toHaveBeenNthCalledWith(1, groupId1);
      expect(groupRepository.findById).toHaveBeenNthCalledWith(2, groupId2);
      expect(groupRepository.deleteWithTransaction).toHaveBeenCalledTimes(2);
      expect(groupRepository.deleteWithTransaction).toHaveBeenNthCalledWith(
        1,
        groupId1,
      );
      expect(groupRepository.deleteWithTransaction).toHaveBeenNthCalledWith(
        2,
        groupId2,
      );
    });
  });
});
