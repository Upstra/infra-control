import { UpsDomainService } from './../../domain/services/ups.domain.service';
import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsUpdateDto } from '../../application/dto/ups.update.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Updates an existing UPS device’s configuration and status.
 *
 * Responsibilities:
 * - Validates the UPS ID and input DTO (capacity, thresholds).
 * - Fetches the current entity and applies updates via UpsDomainService.
 * - Persists changes and returns the updated UpsDto.
 *
 * @param id   UUID of the UPS to update.
 * @param dto  UpdateUpsDto with fields to modify.
 * @returns    Promise<UpsDto> the updated UPS DTO.
 *
 * @throws NotFoundException if the UPS does not exist.
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const updated = await updateUpsUseCase.execute('ups-uuid-123', { capacity:600 });
 */

@Injectable()
export class UpdateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsDomainService: UpsDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: UpsUpdateDto,
    userId?: string,
  ): Promise<UpsResponseDto> {
    let ups = await this.upsRepository.findUpsById(id);

    ups = await this.upsDomainService.createUpsEntityFromUpdateDto(ups, dto);
    const saved = await this.upsRepository.save(ups);
    ups = Array.isArray(saved) ? saved[0] : saved;
    await this.logHistory?.execute('ups', ups.id, 'UPDATE', userId);
    return new UpsResponseDto(ups);
  }
}
