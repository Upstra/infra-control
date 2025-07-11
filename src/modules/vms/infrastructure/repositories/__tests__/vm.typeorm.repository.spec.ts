import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { VmTypeormRepository } from '../vm.typeorm.repository';
import { VmRetrievalException } from '../../../domain/exceptions/vm.exception';
import { EntityManager } from 'typeorm';

describe('VmTypeormRepository', () => {
  let repository: VmTypeormRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    mockEntityManager = {
      getRepository: jest.fn().mockReturnThis(),
    } as any;

    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        VmTypeormRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<VmTypeormRepository>(VmTypeormRepository);
  });

  describe('countByState', () => {
    it('should count VMs with UP state', async () => {
      const expectedCount = 10;
      jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);

      const result = await repository.countByState('UP');

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalledWith({
        where: { state: 'UP' },
      });
    });

    it('should count VMs with DOWN state', async () => {
      const expectedCount = 2;
      jest.spyOn(repository, 'count').mockResolvedValue(expectedCount);

      const result = await repository.countByState('DOWN');

      expect(result).toBe(expectedCount);
      expect(repository.count).toHaveBeenCalledWith({
        where: { state: 'DOWN' },
      });
    });

    it('should throw VmRetrievalException on error', async () => {
      const error = new Error('Database error');
      jest.spyOn(repository, 'count').mockRejectedValue(error);

      await expect(repository.countByState('UP')).rejects.toThrow(
        VmRetrievalException,
      );
    });
  });
});
