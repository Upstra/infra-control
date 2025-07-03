import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UpsTypeormRepository } from '../ups.typeorm.repository';

describe('UpsTypeormRepository', () => {
  let repository: UpsTypeormRepository;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  const mockDataSource = {
    createEntityManager: jest.fn(() => ({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsTypeormRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UpsTypeormRepository>(UpsTypeormRepository);
    repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllWithServerCount', () => {
    it('should return UPS entities with server count', async () => {
      const mockUps = [
        { id: '1', name: 'UPS 1', serverCount: 5 },
        { id: '2', name: 'UPS 2', serverCount: 3 },
      ];

      mockQueryBuilder.getMany.mockResolvedValueOnce(mockUps);

      const result = await repository.findAllWithServerCount();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('ups');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'ups.servers',
        'server',
      );
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith(
        'ups.serverCount',
        'ups.servers',
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ ups: mockUps[0], serverCount: 5 });
      expect(result[1]).toEqual({ ups: mockUps[1], serverCount: 3 });
    });

    it('should handle UPS without servers', async () => {
      const mockUps = [{ id: '1', name: 'UPS 1' }];

      mockQueryBuilder.getMany.mockResolvedValueOnce(mockUps);

      const result = await repository.findAllWithServerCount();

      expect(result[0]).toEqual({ ups: mockUps[0], serverCount: 0 });
    });
  });

  describe('paginateWithServerCount', () => {
    it('should return paginated UPS entities with server count', async () => {
      const mockUps = [
        { id: '1', name: 'UPS 1', serverCount: 5 },
        { id: '2', name: 'UPS 2', serverCount: 3 },
      ];
      const total = 10;

      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockUps, total]);

      const result = await repository.paginateWithServerCount(2, 5);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('ups');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit = (2 - 1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('ups.name', 'ASC');
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toBe(total);
      expect(result[0][0]).toEqual({ ups: mockUps[0], serverCount: 5 });
    });
  });

  describe('findByIdWithServerCount', () => {
    it('should return a single UPS with server count', async () => {
      const mockUps = { id: '1', name: 'UPS 1', serverCount: 5 };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUps);

      const result = await repository.findByIdWithServerCount('1');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('ups');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ups.id = :id', {
        id: '1',
      });
      expect(result).toEqual({ ups: mockUps, serverCount: 5 });
    });

    it('should return null if UPS not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      const result = await repository.findByIdWithServerCount('non-existent');

      expect(result).toBeNull();
    });

    it('should handle UPS without servers', async () => {
      const mockUps = { id: '1', name: 'UPS 1' };

      mockQueryBuilder.getOne.mockResolvedValueOnce(mockUps);

      const result = await repository.findByIdWithServerCount('1');

      expect(result).toEqual({ ups: mockUps, serverCount: 0 });
    });
  });
});
