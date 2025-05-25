import { GetIloByIdUseCase } from '../get-ilo-by-id.use-case';
import { Ilo } from '@/modules/ilos/domain/entities/ilo.entity';
import { IloResponseDto } from '@/modules/ilos/application/dto/ilo.response.dto';

describe('GetIloByIdUseCase', () => {
  let useCase: GetIloByIdUseCase;
  let repo: any;

  beforeEach(() => {
    repo = { findIloById: jest.fn() };
    useCase = new GetIloByIdUseCase(repo);
  });

  it('should return IloResponseDto for found entity', async () => {
    const entity = Object.assign(new Ilo(), { name: 'ilo', ip: '10.0.0.1' });
    repo.findIloById.mockResolvedValue(entity);

    const res = await useCase.execute('ilo-id');
    expect(res).toBeInstanceOf(IloResponseDto);
    expect(res.name).toBe('ilo');
    expect(repo.findIloById).toHaveBeenCalledWith('ilo-id');
  });

  it('should throw if not found', async () => {
    repo.findIloById.mockRejectedValue(new Error('Not found'));
    await expect(useCase.execute('not-found')).rejects.toThrow('Not found');
  });
});
