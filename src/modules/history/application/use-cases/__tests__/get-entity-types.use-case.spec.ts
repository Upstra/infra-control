import { Test, TestingModule } from '@nestjs/testing';
import { GetHistoryEntityTypesUseCase } from '../get-entity-types.use-case';
import { HistoryRepositoryInterface } from '../../../domain/interfaces/history.repository.interface';
import { EntityTypesResponseDto } from '../../dto/entity-types.response.dto';

describe('GetHistoryEntityTypesUseCase', () => {
  let useCase: GetHistoryEntityTypesUseCase;
  let mockHistoryRepository: jest.Mocked<HistoryRepositoryInterface>;

  beforeEach(async () => {
    mockHistoryRepository = {
      findDistinctEntityTypes: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findOneByField: jest.fn(),
      countCreatedByMonth: jest.fn(),
      paginate: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHistoryEntityTypesUseCase,
        {
          provide: 'HistoryRepositoryInterface',
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetHistoryEntityTypesUseCase>(
      GetHistoryEntityTypesUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return EntityTypesResponseDto with distinct entity types from repository', async () => {
      const mockEntityTypes = ['Server', 'VM', 'User', 'Group'];
      mockHistoryRepository.findDistinctEntityTypes.mockResolvedValue(
        mockEntityTypes,
      );

      const result = await useCase.execute();

      expect(
        mockHistoryRepository.findDistinctEntityTypes,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockHistoryRepository.findDistinctEntityTypes,
      ).toHaveBeenCalledWith();
      expect(result).toBeInstanceOf(EntityTypesResponseDto);
      expect(result.entityTypes).toEqual(mockEntityTypes);
    });

    it('should return EntityTypesResponseDto with empty array when no entity types exist', async () => {
      const mockEntityTypes: string[] = [];
      mockHistoryRepository.findDistinctEntityTypes.mockResolvedValue(
        mockEntityTypes,
      );

      const result = await useCase.execute();

      expect(
        mockHistoryRepository.findDistinctEntityTypes,
      ).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(EntityTypesResponseDto);
      expect(result.entityTypes).toEqual([]);
    });

    it('should handle repository errors', async () => {
      const mockError = new Error('Database connection failed');
      mockHistoryRepository.findDistinctEntityTypes.mockRejectedValue(
        mockError,
      );

      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
      expect(
        mockHistoryRepository.findDistinctEntityTypes,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return EntityTypesResponseDto with entity types in repository order', async () => {
      const mockEntityTypes = ['User', 'Server', 'Group', 'VM'];
      mockHistoryRepository.findDistinctEntityTypes.mockResolvedValue(
        mockEntityTypes,
      );

      const result = await useCase.execute();

      expect(result).toBeInstanceOf(EntityTypesResponseDto);
      expect(result.entityTypes).toEqual(mockEntityTypes);
    });

    it('should create new DTO instance for each call', async () => {
      const mockEntityTypes = ['Server', 'VM'];
      mockHistoryRepository.findDistinctEntityTypes.mockResolvedValue(
        mockEntityTypes,
      );

      const result1 = await useCase.execute();
      const result2 = await useCase.execute();

      expect(result1).toBeInstanceOf(EntityTypesResponseDto);
      expect(result2).toBeInstanceOf(EntityTypesResponseDto);
      expect(result1).not.toBe(result2);
      expect(result1.entityTypes).toEqual(result2.entityTypes);
    });
  });
});
