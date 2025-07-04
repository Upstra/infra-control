import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GroupServerTypeormRepository } from '../group.server.typeorm.repository';
import { GroupServer } from '../../../domain/entities/group.server.entity';

describe('GroupServerTypeormRepository', () => {
  let repository: GroupServerTypeormRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<GroupServer>>;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    } as any;

    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue({}),
    } as any;

    repository = new GroupServerTypeormRepository(mockDataSource);
    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(mockQueryBuilder);
  });

  describe('findAll', () => {
    it('should apply filters and relations', async () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }] as GroupServer[];
      mockQueryBuilder.getMany.mockResolvedValue(mockGroups);

      const result = await repository.findAll(['servers', 'vmGroups'], {
        roomId: 'room-123',
        priority: 3,
      });

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'group.servers',
        'servers',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'group.vmGroups',
        'vmGroups',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'group.roomId = :roomId',
        { roomId: 'room-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'group.priority = :priority',
        { priority: 3 },
      );
      expect(result).toEqual(mockGroups);
    });

    it('should work without filters', async () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }] as GroupServer[];
      mockQueryBuilder.getMany.mockResolvedValue(mockGroups);

      await repository.findAll(['servers']);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'group.servers',
        'servers',
      );
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should work with only roomId filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(['servers'], { roomId: 'room-456' });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'group.roomId = :roomId',
        { roomId: 'room-456' },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should work with only priority filter', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(['servers'], { priority: 1 });

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'group.priority = :priority',
        { priority: 1 },
      );
    });
  });

  describe('findAllPaginated', () => {
    it('should apply filters, relations and pagination', async () => {
      const mockGroups = [{ id: '1', name: 'Group 1' }] as GroupServer[];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockGroups, 10]);

      const result = await repository.findAllPaginated(
        ['servers', 'vmGroups'],
        { roomId: 'room-123', priority: 2 },
        2,
        5,
      );

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'group.servers',
        'servers',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'group.vmGroups',
        'vmGroups',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'group.roomId = :roomId',
        { roomId: 'room-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'group.priority = :priority',
        { priority: 2 },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit = (2 - 1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockGroups, 10]);
    });

    it('should use default pagination values', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findAllPaginated(['servers']);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1 - 1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should handle large page numbers', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 100]);

      await repository.findAllPaginated(['servers'], undefined, 10, 20);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(180); // (10 - 1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should work without filters but with pagination', async () => {
      const mockGroups = [{ id: '1' }, { id: '2' }] as GroupServer[];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockGroups, 50]);

      const result = await repository.findAllPaginated(
        ['servers'],
        undefined,
        3,
        15,
      );

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(30); // (3 - 1) * 15
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
      expect(result).toEqual([mockGroups, 50]);
    });
  });

  describe('applyFiltersAndRelations (indirect test)', () => {
    it('should apply same filters for both findAll and findAllPaginated', async () => {
      const filters = { roomId: 'room-789', priority: 4 };
      const relations = ['servers', 'vmGroups'];

      // Reset mocks
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Call findAll
      await repository.findAll(relations, filters);
      const findAllCalls = {
        leftJoinAndSelect: [...mockQueryBuilder.leftJoinAndSelect.mock.calls],
        where: [...mockQueryBuilder.where.mock.calls],
        andWhere: [...mockQueryBuilder.andWhere.mock.calls],
      };

      mockQueryBuilder.leftJoinAndSelect.mockClear();
      mockQueryBuilder.where.mockClear();
      mockQueryBuilder.andWhere.mockClear();

      await repository.findAllPaginated(relations, filters);

      expect(mockQueryBuilder.leftJoinAndSelect.mock.calls).toEqual(
        findAllCalls.leftJoinAndSelect,
      );
      expect(mockQueryBuilder.where.mock.calls).toEqual(findAllCalls.where);
      expect(mockQueryBuilder.andWhere.mock.calls).toEqual(
        findAllCalls.andWhere,
      );
    });
  });
});
