import { GetUpsByIdUseCase } from '../../use-cases/get-ups-by-id.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';

describe('GetUpsByIdUseCase', () => {
  let useCase: GetUpsByIdUseCase;
  let repo: jest.Mocked<UpsRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findUpsById: jest.fn(),
    } as any;

    useCase = new GetUpsByIdUseCase(repo);
  });

  it('should return an UpsResponseDto when UPS is found', async () => {
    const mockUps = createMockUps();

    repo.findUpsById.mockResolvedValue(mockUps);

    const result = await useCase.execute('ups-id');

    expect(result).toEqual(new UpsResponseDto(mockUps));
    expect(repo.findUpsById).toHaveBeenCalledWith('ups-id');
  });

  it('should throw UpsNotFoundException if UPS is not found', async () => {
    repo.findUpsById.mockRejectedValue(
      new UpsNotFoundException('not-found-id'),
    );

    await expect(useCase.execute('not-found-id')).rejects.toThrow(
      UpsNotFoundException,
    );
    expect(repo.findUpsById).toHaveBeenCalledWith('not-found-id');
  });
});
