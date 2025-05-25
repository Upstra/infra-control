import { CreateIloUseCase } from '../create-ilo.use-case';
import { IloDomainService } from '@/modules/ilos/domain/services/ilo.domain.service';
import { IloCreationDto } from '@/modules/ilos/application/dto/ilo.creation.dto';
import { IloResponseDto } from '@/modules/ilos/application/dto/ilo.response.dto';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilo.mock';

describe('CreateIloUseCase', () => {
  let useCase: CreateIloUseCase;
  let repo: any;
  let domain: IloDomainService;

  beforeEach(() => {
    repo = { save: jest.fn() };
    domain = new IloDomainService();
    useCase = new CreateIloUseCase(repo, domain);
  });

  it('should create and return the ilo', async () => {
    const dto: IloCreationDto = {
      name: 'ilo',
      ip: '10.0.0.1',
      login: 'root',
      password: 'pwd',
    };
    const entity = createMockIlo();
    repo.save.mockResolvedValue(entity);

    const res = await useCase.execute(dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ilo' }),
    );
    expect(res).toBeInstanceOf(IloResponseDto);
    expect(res.name).toBe('ilo');
  });

  it('should throw if repository.save fails', async () => {
    const dto: IloCreationDto = {
      name: 'ilo',
      ip: '10.0.0.1',
      login: 'root',
      password: 'pwd',
    };
    repo.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });
});
