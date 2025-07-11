import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ServerTypeormRepository } from '../server.typeorm.repository';
import { Server } from '../../../domain/entities/server.entity';
import { ServerRetrievalException } from '../../../domain/exceptions/server.exception';

describe('ServerTypeormRepository', () => {
  let repository: ServerTypeormRepository;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue({}),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        ServerTypeormRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<ServerTypeormRepository>(ServerTypeormRepository);
  });

  describe('countByState', () => {
    it('should count servers with UP state', async () => {
      const expectedCount = 5;
      jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);

      const result = await repository.countByState('UP');

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalledWith({
        where: { state: 'UP' },
      });
    });

    it('should count servers with DOWN state', async () => {
      const expectedCount = 3;
      jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);

      const result = await repository.countByState('DOWN');

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalledWith({
        where: { state: 'DOWN' },
      });
    });

    it('should throw ServerRetrievalException on error', async () => {
      const error = new Error('Database error');
      jest.spyOn(repository, 'count').mockRejectedValue(error);

      await expect(repository.countByState('UP')).rejects.toThrow(
        ServerRetrievalException,
      );
    });
  });

});