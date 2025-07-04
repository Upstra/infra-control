import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { GroupRepository } from '../group.repository';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';

describe('GroupRepository', () => {
  let repository: GroupRepository;
  let mockRepository: jest.Mocked<Repository<Group>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupRepository,
        {
          provide: getRepositoryToken(Group),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn(),
                delete: jest.fn(),
                update: jest.fn(),
              },
            })),
          },
        },
      ],
    }).compile();

    repository = module.get<GroupRepository>(GroupRepository);
    mockRepository = module.get(getRepositoryToken(Group));
  });

  describe('findAll', () => {
    it('should return all active groups when no type is specified', async () => {
      const mockGroups = [
        { id: '1', name: 'Group 1', type: GroupType.VM },
        { id: '2', name: 'Group 2', type: GroupType.SERVER },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockGroups),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findAll();

      expect(result).toEqual(mockGroups);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'group.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'group.name',
        'ASC',
      );
    });

    it('should filter by type when type is specified', async () => {
      const mockGroups = [{ id: '1', name: 'Group 1', type: GroupType.VM }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockGroups),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findAll(GroupType.VM);

      expect(result).toEqual(mockGroups);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'group.type = :type',
        { type: GroupType.VM },
      );
    });
  });

  describe('findById', () => {
    it('should return a group by id', async () => {
      const mockGroup = { id: '1', name: 'Group 1' };
      mockRepository.findOne.mockResolvedValue(mockGroup as Group);

      const result = await repository.findById('1');

      expect(result).toEqual(mockGroup);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when group not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a group by name', async () => {
      const mockGroup = { id: '1', name: 'Group 1' };
      mockRepository.findOne.mockResolvedValue(mockGroup as Group);

      const result = await repository.findByName('Group 1');

      expect(result).toEqual(mockGroup);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Group 1' },
      });
    });
  });

  describe('existsByName', () => {
    it('should return true when group exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.existsByName('Group 1');

      expect(result).toBe(true);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { name: 'Group 1' },
      });
    });

    it('should return false when group does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await repository.existsByName('Non-existent');

      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('should save a group', async () => {
      const mockGroup = { id: '1', name: 'Group 1' } as Group;
      mockRepository.save.mockResolvedValue(mockGroup);

      const result = await repository.save(mockGroup);

      expect(result).toEqual(mockGroup);
      expect(mockRepository.save).toHaveBeenCalledWith(mockGroup);
    });
  });

  describe('delete', () => {
    it('should delete a group by id', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('findByIdWithCounts', () => {
    it('should return group with server count for SERVER type group', async () => {
      const groupId = 'group-123';
      const mockGroup = {
        id: groupId,
        name: 'Server Group',
        type: GroupType.SERVER,
        isActive: true,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockGroup],
          raw: [{ serverCount: '5', vmCount: '0' }],
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findByIdWithCounts(groupId);

      expect(result).toEqual({
        ...mockGroup,
        serverCount: 5,
        vmCount: 0,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('group.id = :id', {
        id: groupId,
      });
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'group.servers',
        'server',
      );
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('group.vms', 'vm');
    });

    it('should return null when group not found', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [],
          raw: [],
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findByIdWithCounts('non-existent');

      expect(result).toBeNull();
    });
  });
});
