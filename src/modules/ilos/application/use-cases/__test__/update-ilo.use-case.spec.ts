import { UpdateIloUseCase } from '../update-ilo.use-case';
import { IloDomainService } from '@/modules/ilos/domain/services/ilo.domain.service';
import { IloUpdateDto } from '@/modules/ilos/application/dto/ilo.update.dto';
import { IloResponseDto } from '@/modules/ilos/application/dto/ilo.response.dto';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilo.mock';

describe('UpdateIloUseCase', () => {
  let useCase: UpdateIloUseCase;
  let repo: any;
  let domain: IloDomainService;

  beforeEach(() => {
    repo = {
      findIloById: jest.fn(),
      findIloByIdWithCredentials: jest.fn(),
      save: jest.fn(),
      updateIlo: jest.fn(),
    };
    domain = new IloDomainService();
    useCase = new UpdateIloUseCase(repo, domain);
  });

  it('should update and return IloResponseDto', async () => {
    const entity = createMockIlo();
    repo.findIloByIdWithCredentials.mockResolvedValue(entity);
    repo.updateIlo.mockResolvedValue({
      ...entity,
      name: 'newilo',
      ip: '10.0.0.9',
    });

    const dto: IloUpdateDto = { id: 'ilo-id', name: 'newilo', ip: '10.0.0.9' };
    const res = await useCase.execute(dto);

    expect(repo.findIloByIdWithCredentials).toHaveBeenCalledWith('ilo-id');
    expect(repo.updateIlo).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'newilo', ip: '10.0.0.9' }),
    );
    expect(res).toBeInstanceOf(IloResponseDto);
    expect(res.name).toBe('newilo');
  });

  it('should throw if not found', async () => {
    repo.findIloByIdWithCredentials.mockRejectedValue(new Error('Not found'));
    await expect(useCase.execute({ id: 'bad-id' })).rejects.toThrow(
      'Not found',
    );
  });

  it('should throw if repository.updateIlo fails', async () => {
    const entity = createMockIlo();
    repo.findIloByIdWithCredentials.mockResolvedValue(entity);
    repo.updateIlo.mockRejectedValue(new Error('Update failed'));

    await expect(
      useCase.execute({ id: 'ilo-id', name: 'err' }),
    ).rejects.toThrow('Update failed');
  });
});
