import { DeleteUpsUseCase } from '../delete-ups.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { createMockUps } from '../../../__mocks__/ups.mock';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';

describe('DeleteUpsUseCase', () => {
  let useCase: DeleteUpsUseCase;
  let repo: jest.Mocked<UpsRepositoryInterface>;

  beforeEach(() => {
    repo = {
      findUpsById: jest.fn(),
      deleteUps: jest.fn(),
    } as any;

    useCase = new DeleteUpsUseCase(repo);
  });

  it('should delete an UPS by ID successfully', async () => {
    const mockUps = createMockUps();
    repo.findUpsById.mockResolvedValue(mockUps);

    await useCase.execute('ups-id-123');

    expect(repo.findUpsById).toHaveBeenCalledWith('ups-id-123');
    expect(repo.deleteUps).toHaveBeenCalledWith('ups-id-123');
  });

  it('should throw UpsNotFoundException if UPS does not exist', async () => {
    repo.findUpsById.mockImplementation(() => {
      throw new UpsNotFoundException('ups-id-404');
    });

    await expect(useCase.execute('ups-id-404')).rejects.toThrow(
      UpsNotFoundException,
    );
    expect(repo.deleteUps).not.toHaveBeenCalled();
  });
});
