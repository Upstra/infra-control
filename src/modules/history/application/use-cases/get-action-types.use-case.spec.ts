import { Test, TestingModule } from '@nestjs/testing';
import { GetHistoryActionTypesUseCase } from './get-action-types.use-case';
import { HistoryRepositoryInterface } from '../../domain/interfaces/history.repository.interface';

describe('GetHistoryActionTypesUseCase', () => {
  let useCase: GetHistoryActionTypesUseCase;
  let historyRepository: jest.Mocked<HistoryRepositoryInterface>;

  beforeEach(async () => {
    const mockHistoryRepository = {
      findDistinctActionTypes: jest.fn(),
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
        GetHistoryActionTypesUseCase,
        {
          provide: 'HistoryRepositoryInterface',
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetHistoryActionTypesUseCase>(GetHistoryActionTypesUseCase);
    historyRepository = module.get('HistoryRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should categorize action types correctly', async () => {
      const mockActionTypes = [
        'CREATE',
        'REGISTER',
        'UPDATE',
        'UPDATE_ROLE',
        'ROLE_ASSIGNED',
        'ROLE_REMOVED',
        'PRIORITY_SWAP',
        'DELETE',
        'LOGIN',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        '2FA_ENABLED',
        '2FA_DISABLED',
        'START',
        'RESTART',
        'SHUTDOWN',
      ];

      historyRepository.findDistinctActionTypes.mockResolvedValue(mockActionTypes);

      const result = await useCase.execute();

      expect(result.create).toEqual(['CREATE', 'REGISTER']);
      expect(result.update).toEqual([
        'UPDATE',
        'UPDATE_ROLE',
        'ROLE_ASSIGNED',
        'ROLE_REMOVED',
        'PRIORITY_SWAP',
      ]);
      expect(result.delete).toEqual(['DELETE']);
      expect(result.auth).toEqual([
        'LOGIN',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        '2FA_ENABLED',
        '2FA_DISABLED',
      ]);
      expect(result.server).toEqual(['START', 'RESTART', 'SHUTDOWN']);
    });

    it('should handle empty action types', async () => {
      historyRepository.findDistinctActionTypes.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.create).toEqual([]);
      expect(result.update).toEqual([]);
      expect(result.delete).toEqual([]);
      expect(result.auth).toEqual([]);
      expect(result.server).toEqual([]);
    });

    it('should put uncategorized actions in update category', async () => {
      const mockActionTypes = ['UNKNOWN_ACTION', 'CUSTOM_EVENT'];

      historyRepository.findDistinctActionTypes.mockResolvedValue(mockActionTypes);

      const result = await useCase.execute();

      expect(result.update).toEqual(['UNKNOWN_ACTION', 'CUSTOM_EVENT']);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      historyRepository.findDistinctActionTypes.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
    });
  });
});