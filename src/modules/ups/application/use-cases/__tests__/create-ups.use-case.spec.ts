import { CreateUpsUseCase } from '../create-ups.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { UpsDomainService } from '../../../domain/services/ups.domain.service';
import { createMockUps, createMockUpsDto } from '../../../__mocks__/ups.mock';
import { UpsResponseDto } from '../../dto/ups.response.dto';

describe('CreateUpsUseCase', () => {
  let useCase: CreateUpsUseCase;
  let mockRepo: jest.Mocked<UpsRepositoryInterface>;
  let mockDomain: jest.Mocked<UpsDomainService>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
    } as any;

    mockDomain = {
      createUpsEntityFromCreateDto: jest.fn(),
    } as any;

    useCase = new CreateUpsUseCase(mockRepo, mockDomain);
  });

  it('should create and return a valid UpsResponseDto', async () => {
    const dto = createMockUpsDto();
    const entity = await createMockUps();

    mockDomain.createUpsEntityFromCreateDto.mockResolvedValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(UpsResponseDto);
    expect(result.id).toBe(entity.id);
    expect(result.serverCount).toBe(0);
    expect(mockRepo.save).toHaveBeenCalledWith(entity);
  });

  it('should handle repository.save returning an array', async () => {
    const dto = createMockUpsDto();
    const entity = await createMockUps();

    mockDomain.createUpsEntityFromCreateDto.mockResolvedValue(entity);
    mockRepo.save.mockResolvedValue(entity);

    const result = await useCase.execute(dto);

    expect(result).toBeInstanceOf(UpsResponseDto);
    expect(result.id).toBe(entity.id);
    expect(result.serverCount).toBe(0);
  });

  it('should throw if domain service fails', async () => {
    const dto = createMockUpsDto();

    mockDomain.createUpsEntityFromCreateDto.mockRejectedValue(
      new Error('Domain error'),
    );

    await expect(useCase.execute(dto)).rejects.toThrow('Domain error');
  });
});
