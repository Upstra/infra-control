import { CreateServerUseCase } from '../create-server.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import {
  createMockServer,
  createMockServerCreationDto,
} from '@/modules/servers/__mocks__/servers.mock';
import { createMockIloResponseDto } from '@/modules/ilos/__mocks__/ilo.mock';

jest.mock('@/modules/ilos/application/use-cases');

describe('CreateServerUseCase', () => {
  let useCase: CreateServerUseCase;
  let repo: jest.Mocked<ServerRepositoryInterface>;
  let domain: ServerDomainService;
  let iloUseCase: jest.Mocked<CreateIloUseCase>;

  beforeEach(() => {
    repo = {
      save: jest.fn(),
    } as any;

    domain = new ServerDomainService();
    iloUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new CreateServerUseCase(repo, iloUseCase, domain);
  });

  it('should create a server and return ServerResponseDto', async () => {
    const dto = createMockServerCreationDto();
    const mockServer = createMockServer();
    const mockIloDto = createMockIloResponseDto({
      name: 'ILO-Test',
      ip: '10.0.0.1',
    });

    repo.save.mockResolvedValue(mockServer);
    iloUseCase.execute.mockResolvedValue(mockIloDto);

    const result = await useCase.execute(dto);

    expect(repo.save).toHaveBeenCalled();
    expect(iloUseCase.execute).toHaveBeenCalledWith(dto.ilo);
    expect(result).toBeInstanceOf(Object);
    expect(result.name).toBe(mockServer.name);
    expect(result.ilo).toEqual(mockIloDto);
  });

  it('should throw if save fails', async () => {
    const dto = createMockServerCreationDto();
    repo.save.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('DB Error');
  });

  it('should throw if ilo creation fails', async () => {
    const dto = createMockServerCreationDto();
    const mockServer = createMockServer();
    repo.save.mockResolvedValue(mockServer);
    iloUseCase.execute.mockRejectedValue(new Error('ILO Error'));

    await expect(useCase.execute(dto)).rejects.toThrow('ILO Error');
  });
});
