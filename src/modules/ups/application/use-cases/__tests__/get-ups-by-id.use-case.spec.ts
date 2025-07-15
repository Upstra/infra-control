import { Test, TestingModule } from '@nestjs/testing';
import { GetUpsByIdUseCase } from '../get-ups-by-id.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { Ups } from '../../../domain/entities/ups.entity';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('GetUpsByIdUseCase', () => {
  let useCase: GetUpsByIdUseCase;
  let repository: UpsRepositoryInterface;

  const mockUpsRepository = {
    findByIdWithServerCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsByIdUseCase,
        {
          provide: 'UpsRepositoryInterface',
          useValue: mockUpsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUpsByIdUseCase>(GetUpsByIdUseCase);
    repository = module.get<UpsRepositoryInterface>('UpsRepositoryInterface');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return UPS with server count when found', async () => {
      const mockUps: Ups = {
        id: 'test-id',
        name: 'Test UPS',
        ip: '192.168.1.100',
        grace_period_on: 30,
        grace_period_off: 60,
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockResult = { ups: mockUps, serverCount: 3 };

      mockUpsRepository.findByIdWithServerCount.mockResolvedValueOnce(
        mockResult,
      );

      const result = await useCase.execute('test-id');

      expect(repository.findByIdWithServerCount).toHaveBeenCalledWith(
        'test-id',
      );
      expect(result).toBeInstanceOf(UpsResponseDto);
      expect(result.id).toBe('test-id');
      expect(result.serverCount).toBe(3);
    });

    it('should throw UpsNotFoundException when UPS not found', async () => {
      mockUpsRepository.findByIdWithServerCount.mockResolvedValueOnce(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        UpsNotFoundException,
      );
      expect(repository.findByIdWithServerCount).toHaveBeenCalledWith(
        'non-existent',
      );
    });

    it('should handle UPS with zero servers', async () => {
      const mockUps: Ups = {
        id: 'test-id',
        name: 'Test UPS',
        ip: '192.168.1.100',
        grace_period_on: 30,
        grace_period_off: 60,
        roomId: 'room-1',
        servers: [],
        room: null,
      } as Ups;

      const mockResult = { ups: mockUps, serverCount: 0 };

      mockUpsRepository.findByIdWithServerCount.mockResolvedValueOnce(
        mockResult,
      );

      const result = await useCase.execute('test-id');

      expect(result.serverCount).toBe(0);
    });

    it('should map all UPS properties correctly', async () => {
      const mockUps: Ups = {
        id: 'test-id',
        name: 'Test UPS',
        ip: '10.0.0.1',
        grace_period_on: 45,
        grace_period_off: 90,
        roomId: 'room-test',
        servers: [],
        room: null,
      } as Ups;

      const mockResult = { ups: mockUps, serverCount: 10 };

      mockUpsRepository.findByIdWithServerCount.mockResolvedValueOnce(
        mockResult,
      );

      const result = await useCase.execute('test-id');

      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Test UPS');
      expect(result.ip).toBe('10.0.0.1');
      expect(result.roomId).toBe('room-test');
      expect(result.serverCount).toBe(10);
    });

    it('should return UPS with servers list when servers are present', async () => {
      const mockServers: Server[] = [
        {
          id: 'server-1',
          name: 'Web Server',
          ip: '192.168.1.10',
          state: 'UP',
          type: 'vcenter',
        } as Server,
        {
          id: 'server-2',
          name: 'DB Server',
          ip: '192.168.1.11',
          state: 'DOWN',
          type: 'esxi',
        } as Server,
      ];

      const mockUps: Ups = {
        id: 'test-id',
        name: 'Test UPS',
        ip: '192.168.1.100',
        grace_period_on: 30,
        grace_period_off: 60,
        roomId: 'room-1',
        servers: mockServers,
        room: null,
      } as Ups;

      const mockResult = { ups: mockUps, serverCount: 2 };

      mockUpsRepository.findByIdWithServerCount.mockResolvedValueOnce(
        mockResult,
      );

      const result = await useCase.execute('test-id');

      expect(result).toBeInstanceOf(UpsResponseDto);
      expect(result.servers).toHaveLength(2);
      expect(result.servers[0].id).toBe('server-1');
      expect(result.servers[0].name).toBe('Web Server');
      expect(result.servers[0].ip).toBe('192.168.1.10');
      expect(result.servers[0].state).toBe('UP');
      expect(result.servers[0].type).toBe('vcenter');
      expect(result.servers[1].id).toBe('server-2');
      expect(result.servers[1].name).toBe('DB Server');
      expect(result.servers[1].ip).toBe('192.168.1.11');
      expect(result.servers[1].state).toBe('DOWN');
      expect(result.servers[1].type).toBe('esxi');
      expect(result.serverCount).toBe(2);
    });
  });
});
