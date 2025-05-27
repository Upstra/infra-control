import { GetAllUpsUseCase } from '../get-all-ups.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { createMockUps } from '../../../__mocks__/ups.mock';
import { Ups } from '../../../domain/entities/ups.entity';

describe('GetAllUpsUseCase', () => {
  let useCase: GetAllUpsUseCase;
  let upsRepository: jest.Mocked<UpsRepositoryInterface>;

  beforeEach(() => {
    upsRepository = {
      findAll: jest.fn(),
    } as any;

    useCase = new GetAllUpsUseCase(upsRepository);
  });

  it('should return a list of UPS as response DTOs', async () => {
    const mockUpsList: Ups[] = [
      createMockUps({ id: 'ups-1', name: 'UPS-A' }),
      createMockUps({ id: 'ups-2', name: 'UPS-B' }),
    ];
    upsRepository.findAll.mockResolvedValue(mockUpsList);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ups-1');
    expect(result[1].name).toBe('UPS-B');
  });

  it('should return an empty array if no UPS found', async () => {
    upsRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
