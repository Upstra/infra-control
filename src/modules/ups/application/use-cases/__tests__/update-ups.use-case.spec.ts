import { UpdateUpsUseCase } from '../update-ups.use-case';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { UpsDomainService } from '../../../domain/services/ups.domain.service';
import { UpsUpdateDto } from '../../dto/ups.update.dto';
import { UpsResponseDto } from '../../dto/ups.response.dto';
import { createMockUps } from '../../../__mocks__/ups.mock';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';

describe('UpdateUpsUseCase', () => {
  let useCase: UpdateUpsUseCase;
  let repo: jest.Mocked<UpsRepositoryInterface>;
  let domain: jest.Mocked<UpsDomainService>;

  beforeEach(() => {
    repo = {
      findUpsById: jest.fn(),
      save: jest.fn(),
      findByIdWithServerCount: jest.fn(),
    } as any;

    domain = {
      createUpsEntityFromUpdateDto: jest.fn(),
    } as any;

    useCase = new UpdateUpsUseCase(repo, domain);
  });

  it('should update and return UpsResponseDto', async () => {
    const existing = createMockUps({ name: 'Old UPS' });
    const updated = createMockUps({ name: 'New UPS' });
    const dto: UpsUpdateDto = { name: 'New UPS' };

    repo.findUpsById.mockResolvedValue(existing);
    domain.createUpsEntityFromUpdateDto.mockResolvedValue(updated);
    repo.save.mockResolvedValue(updated);
    repo.findByIdWithServerCount.mockResolvedValue({
      ups: updated,
      serverCount: 3,
    });

    const result = await useCase.execute('ups-id', dto);

    expect(repo.findUpsById).toHaveBeenCalledWith('ups-id');
    expect(domain.createUpsEntityFromUpdateDto).toHaveBeenCalledWith(
      existing,
      dto,
    );
    expect(repo.save).toHaveBeenCalledWith(updated);
    expect(repo.findByIdWithServerCount).toHaveBeenCalledWith(updated.id);
    expect(result).toBeInstanceOf(UpsResponseDto);
    expect(result.name).toBe('New UPS');
    expect(result.serverCount).toBe(3);
  });

  it('should handle partial update', async () => {
    const existing = createMockUps({ name: 'Partial UPS' });
    const updated = createMockUps({ name: 'Partial UPS', ip: '192.168.1.100' });
    const dto: UpsUpdateDto = { ip: '192.168.1.100' };

    repo.findUpsById.mockResolvedValue(existing);
    domain.createUpsEntityFromUpdateDto.mockResolvedValue(updated);
    repo.save.mockResolvedValue(updated);
    repo.findByIdWithServerCount.mockResolvedValue({
      ups: updated,
      serverCount: 0,
    });

    const result = await useCase.execute('ups-id', dto);

    expect(result.ip).toBe('192.168.1.100');
    expect(result.name).toBe('Partial UPS');
    expect(result.serverCount).toBe(0);
  });

  it('should throw UpsNotFoundException if UPS does not exist', async () => {
    repo.findUpsById.mockRejectedValue(new UpsNotFoundException('ups-id'));

    await expect(useCase.execute('ups-id', {})).rejects.toThrow(
      UpsNotFoundException,
    );
    expect(repo.findUpsById).toHaveBeenCalledWith('ups-id');
  });
});
