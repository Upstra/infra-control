import { UpdateServerUseCase } from '../update-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { UpdateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerUpdateDto } from '../../dto/server.update.dto';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { createMockIlo } from '@/modules/ilos/__mocks__/ilo.mock';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.exception';

describe('UpdateServerUseCase', () => {
  let useCase: UpdateServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let updateIlo: jest.Mocked<UpdateIloUseCase>;
  let domain: jest.Mocked<ServerDomainService>;

  beforeEach(() => {
    repo = {
      findServerById: jest.fn(),
      save: jest.fn(),
    } as any;

    updateIlo = {
      execute: jest.fn(),
    } as any;

    domain = {
      updateServerEntityFromDto: jest.fn(),
    } as any;

    useCase = new UpdateServerUseCase(repo, updateIlo, domain);
  });

  it('should update the server and its ILO', async () => {
    const dto: ServerUpdateDto = {
      name: 'Updated',
      ilo: { ip: '10.0.0.2', name: 'ILO-2' },
    };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'Updated' }); // 👈 c’est bien ce qu’on veut tester

    repo.findServerById.mockResolvedValue(existing);
    domain.updateServerEntityFromDto.mockReturnValue(updated);
    repo.save.mockResolvedValue(updated);
    updateIlo.execute.mockResolvedValue(createMockIlo({ name: 'ILO-2' }));

    const result = await useCase.execute(existing.id, dto);

    expect(repo.findServerById).toHaveBeenCalledWith(existing.id);
    expect(domain.updateServerEntityFromDto).toHaveBeenCalledWith(
      existing,
      dto,
    );
    expect(updateIlo.execute).toHaveBeenCalledWith(existing.id, dto.ilo);
    expect(result.name).toBe('Updated');
    expect(result.ilo.name).toBe('ILO-2');
  });

  it('should skip ILO update if not present in dto', async () => {
    const dto: ServerUpdateDto = { name: 'NoILO' };
    const existing = createMockServer();
    const updated = createMockServer({ name: 'NoILO' });
    repo.findServerById.mockResolvedValue(existing);
    domain.updateServerEntityFromDto.mockReturnValue(updated);
    repo.save.mockResolvedValue(updated);
    updateIlo.execute.mockResolvedValue(existing.ilo);

    const result = await useCase.execute(existing.id, dto);

    expect(updateIlo.execute).not.toHaveBeenCalled();
    expect(result.name).toBe('NoILO');
  });

  it('should throw if server is not found', async () => {
    repo.findServerById.mockImplementation(() => {
      throw new ServerNotFoundException('not-found');
    });

    await expect(useCase.execute('not-found', {})).rejects.toThrow(
      ServerNotFoundException,
    );
  });
});
