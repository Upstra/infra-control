import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetGroupUseCase } from '../get-group.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { GroupWithCounts } from '../../../domain/interfaces/group.repository.interface';

describe('GetGroupUseCase', () => {
  let useCase: GetGroupUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetGroupUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findByIdWithCounts: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetGroupUseCase>(GetGroupUseCase);
    groupRepository = module.get(GroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const groupId = 'test-group-id';

    it('should return group data when group exists', async () => {
      const mockGroup: GroupWithCounts = {
        id: groupId,
        name: 'Test Group',
        description: 'Test Description',
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        createdBy: 'user-123',
        updatedBy: 'user-456',
        servers: [],
        vms: [],
        serverCount: 5,
        vmCount: 0,
      };

      groupRepository.findByIdWithCounts.mockResolvedValue(mockGroup);

      const result = await useCase.execute(groupId);

      expect(groupRepository.findByIdWithCounts).toHaveBeenCalledWith(groupId);
      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        type: mockGroup.type,
        isActive: mockGroup.isActive,
        createdAt: mockGroup.createdAt,
        updatedAt: mockGroup.updatedAt,
        serverCount: 5,
        vmCount: undefined,
      });
    });

    it('should throw NotFoundException when group does not exist', async () => {
      groupRepository.findByIdWithCounts.mockResolvedValue(null);

      await expect(useCase.execute(groupId)).rejects.toThrow(
        new NotFoundException(`Group with id "${groupId}" not found`),
      );

      expect(groupRepository.findByIdWithCounts).toHaveBeenCalledWith(groupId);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      groupRepository.findByIdWithCounts.mockRejectedValue(error);

      await expect(useCase.execute(groupId)).rejects.toThrow(error);

      expect(groupRepository.findByIdWithCounts).toHaveBeenCalledWith(groupId);
    });

    it('should correctly map VM type groups', async () => {
      const mockGroup: GroupWithCounts = {
        id: groupId,
        name: 'VM Group',
        description: 'VM Group Description',
        type: GroupType.VM,
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        createdBy: 'user-123',
        updatedBy: 'user-456',
        servers: [],
        vms: [],
        serverCount: 0,
        vmCount: 3,
      };

      groupRepository.findByIdWithCounts.mockResolvedValue(mockGroup);

      const result = await useCase.execute(groupId);

      expect(result.type).toBe(GroupType.VM);
      expect(result.isActive).toBe(false);
      expect(result.vmCount).toBe(3);
      expect(result.serverCount).toBeUndefined();
    });

    it('should handle groups with null description', async () => {
      const mockGroup: GroupWithCounts = {
        id: groupId,
        name: 'Test Group',
        description: null,
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        updatedBy: 'user-456',
        servers: [],
        vms: [],
        serverCount: 0,
        vmCount: 0,
      };

      groupRepository.findByIdWithCounts.mockResolvedValue(mockGroup);

      const result = await useCase.execute(groupId);

      expect(result.description).toBeNull();
    });

    it('should fetch multiple groups successfully', async () => {
      const groupId1 = 'group-1';
      const groupId2 = 'group-2';

      const mockGroup1: GroupWithCounts = {
        id: groupId1,
        name: 'Group 1',
        description: null,
        type: GroupType.SERVER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        updatedBy: 'user-456',
        servers: [],
        vms: [],
        serverCount: 2,
        vmCount: 0,
      };

      const mockGroup2: GroupWithCounts = {
        id: groupId2,
        name: 'Group 2',
        description: null,
        type: GroupType.VM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        updatedBy: 'user-456',
        servers: [],
        vms: [],
        serverCount: 0,
        vmCount: 4,
      };

      groupRepository.findByIdWithCounts
        .mockResolvedValueOnce(mockGroup1)
        .mockResolvedValueOnce(mockGroup2);

      const result1 = await useCase.execute(groupId1);
      const result2 = await useCase.execute(groupId2);

      expect(groupRepository.findByIdWithCounts).toHaveBeenCalledTimes(2);
      expect(result1.name).toBe('Group 1');
      expect(result2.name).toBe('Group 2');
    });
  });

  describe('mapToResponseDto', () => {
    it('should map all group properties correctly', async () => {
      const mockGroup: GroupWithCounts = {
        id: '123',
        name: 'Test Group',
        description: 'Detailed description',
        type: GroupType.SERVER,
        isActive: true,
        createdBy: 'user-123',
        updatedBy: 'user-456',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-02T15:30:00Z'),
        servers: [],
        vms: [],
        serverCount: 10,
        vmCount: 0,
      };

      groupRepository.findByIdWithCounts.mockResolvedValue(mockGroup);

      const result = await useCase.execute('123');

      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        description: mockGroup.description,
        type: mockGroup.type,
        isActive: mockGroup.isActive,
        createdAt: mockGroup.createdAt,
        updatedAt: mockGroup.updatedAt,
        serverCount: 10,
        vmCount: undefined,
      });

      expect(result).not.toHaveProperty('createdBy');
      expect(result).not.toHaveProperty('updatedBy');
    });
  });
});
