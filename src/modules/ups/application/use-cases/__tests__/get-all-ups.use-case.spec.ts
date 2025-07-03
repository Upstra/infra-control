import { Test, TestingModule } from '@nestjs/testing';
import { GetAllUpsUseCase } from '../get-all-ups.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { Ups } from '../../../domain/entities/ups.entity';
import { UpsResponseDto } from '../../dto/ups.response.dto';

describe('GetAllUpsUseCase', () => {
  let useCase: GetAllUpsUseCase;
  let repository: UpsRepositoryInterface;

  const mockUpsRepository = {
    findAllWithServerCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllUpsUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllUpsUseCase>(GetAllUpsUseCase);
    repository = module.get<UpsRepositoryInterface>('UpsRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all UPS with server count', async () => {
      const mockUps: Ups = {
        id: '1',
        name: 'UPS 1',
        ip: '192.168.1.100',
        login: 'admin',
        password: 'password',
        grace_period_on: 10,
        grace_period_off: 5,
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockData = [
        { ups: mockUps, serverCount: 5 },
        { ups: { ...mockUps, id: '2', name: 'UPS 2' }, serverCount: 3 },
        { ups: { ...mockUps, id: '3', name: 'UPS 3' }, serverCount: 0 },
      ];

      mockUpsRepository.findAllWithServerCount.mockResolvedValueOnce(mockData);

      const result = await useCase.execute();

      expect(repository.findAllWithServerCount).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(UpsResponseDto);
      expect(result[0].serverCount).toBe(5);
      expect(result[1].serverCount).toBe(3);
      expect(result[2].serverCount).toBe(0);
    });

    it('should handle empty results', async () => {
      mockUpsRepository.findAllWithServerCount.mockResolvedValueOnce([]);

      const result = await useCase.execute();

      expect(result).toHaveLength(0);
    });

    it('should properly map all UPS properties', async () => {
      const mockUps: Ups = {
        id: 'test-id',
        name: 'Test UPS',
        ip: '10.0.0.1',
        login: 'testuser',
        password: 'testpass',
        grace_period_on: 15,
        grace_period_off: 10,
        roomId: 'room-test',
        servers: [],
        room: null,
      } as Ups;

      mockUpsRepository.findAllWithServerCount.mockResolvedValueOnce([
        { ups: mockUps, serverCount: 2 },
      ]);

      const result = await useCase.execute();

      expect(result[0].id).toBe('test-id');
      expect(result[0].name).toBe('Test UPS');
      expect(result[0].ip).toBe('10.0.0.1');
      expect(result[0].grace_period_on).toBe(15);
      expect(result[0].grace_period_off).toBe(10);
      expect(result[0].roomId).toBe('room-test');
      expect(result[0].serverCount).toBe(2);
    });
  });
});