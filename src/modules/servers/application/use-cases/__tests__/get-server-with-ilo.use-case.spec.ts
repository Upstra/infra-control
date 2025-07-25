import { GetServerWithIloUseCase } from '../get-server-with-ilo.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { NotFoundException } from '@nestjs/common';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';

describe('GetServerWithIloUseCase', () => {
  let useCase: GetServerWithIloUseCase;
  let mockServerRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockIlo: Partial<Ilo> = {
    id: 'ilo-1',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password123',
    name: 'iLO Server 1',
  };

  const mockServerWithIlo: Partial<Server> = {
    id: 'server-1',
    name: 'Test Server',
    ip: '192.168.1.10',
    state: 'UP',
    type: 'esxi',
    priority: 1,
    ilo: mockIlo as Ilo,
  };

  const mockServerWithoutIlo: Partial<Server> = {
    id: 'server-2',
    name: 'Test Server 2',
    ip: '192.168.1.11',
    state: 'UP',
    type: 'esxi',
    priority: 2,
    ilo: null,
  };

  beforeEach(() => {
    mockServerRepository = {
      findServerById: jest.fn(),
      findServerByIdWithCredentials: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAllByField: jest.fn(),
      findOneByField: jest.fn(),
      findByIds: jest.fn(),
      findByUserId: jest.fn(),
      countByState: jest.fn(),
    } as unknown as jest.Mocked<ServerRepositoryInterface>;

    useCase = new GetServerWithIloUseCase(mockServerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should return server with iLO when found', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        mockServerWithIlo as Server,
      );

      const result = await useCase.execute('server-1');

      expect(result).toEqual(mockServerWithIlo);
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-1');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when server not found', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockRejectedValue(
        new NotFoundException('Server with ID server-999 not found'),
      );

      await expect(useCase.execute('server-999')).rejects.toThrow(
        new NotFoundException('Server with ID server-999 not found'),
      );

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-999');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when server has no iLO', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        mockServerWithoutIlo as Server,
      );

      await expect(useCase.execute('server-2')).rejects.toThrow(
        new NotFoundException(
          'Server server-2 does not have an iLO configured',
        ),
      );

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-2');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors properly', async () => {
      const dbError = new Error('Database connection error');
      mockServerRepository.findServerByIdWithCredentials.mockRejectedValue(
        dbError,
      );

      await expect(useCase.execute('server-1')).rejects.toThrow(dbError);

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-1');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle null server response', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        null as any,
      );

      await expect(useCase.execute('server-null')).rejects.toThrow(
        new NotFoundException('Server with ID server-null not found'),
      );

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-null');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined server response', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        undefined as any,
      );

      await expect(useCase.execute('server-undefined')).rejects.toThrow(
        new NotFoundException('Server with ID server-undefined not found'),
      );

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-undefined');
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(1);
    });

    it('should validate server id parameter', async () => {
      const emptyId = '';
      mockServerRepository.findServerByIdWithCredentials.mockRejectedValue(
        new NotFoundException(`Server with ID ${emptyId} not found`),
      );

      await expect(useCase.execute(emptyId)).rejects.toThrow(
        new NotFoundException(`Server with ID ${emptyId} not found`),
      );

      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith(emptyId);
    });

    it('should handle server with iLO but missing iLO properties', async () => {
      const serverWithPartialIlo: Partial<Server> = {
        ...mockServerWithIlo,
        ilo: { id: 'ilo-partial' } as Ilo,
      };

      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        serverWithPartialIlo as Server,
      );

      const result = await useCase.execute('server-partial');

      expect(result).toEqual(serverWithPartialIlo);
      expect(result.ilo).toBeDefined();
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith('server-partial');
    });
  });

  describe('constructor', () => {
    it('should create instance with repository', () => {
      const instance = new GetServerWithIloUseCase(mockServerRepository);
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(GetServerWithIloUseCase);
    });
  });

  describe('edge cases', () => {
    it('should handle very long server id', async () => {
      const longId = 'a'.repeat(1000);
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        mockServerWithIlo as Server,
      );

      const result = await useCase.execute(longId);

      expect(result).toEqual(mockServerWithIlo);
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith(longId);
    });

    it('should handle special characters in server id', async () => {
      const specialId = 'server-@#$%-123';
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        mockServerWithIlo as Server,
      );

      const result = await useCase.execute(specialId);

      expect(result).toEqual(mockServerWithIlo);
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledWith(specialId);
    });

    it('should handle concurrent calls', async () => {
      mockServerRepository.findServerByIdWithCredentials.mockResolvedValue(
        mockServerWithIlo as Server,
      );

      const promises = Array.from({ length: 5 }, (_, i) =>
        useCase.execute(`server-${i}`),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(
        mockServerRepository.findServerByIdWithCredentials,
      ).toHaveBeenCalledTimes(5);
    });
  });
});
