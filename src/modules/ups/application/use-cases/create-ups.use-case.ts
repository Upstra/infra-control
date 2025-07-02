import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsCreationDto } from '../../application/dto/ups.creation.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { UpsDomainService } from '../../domain/services/ups.domain.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Creates a new UPS device record with specified configuration.
 *
 * Responsibilities:
 * - Validates CreateUpsDto fields (model, capacity, roomId).
 * - Delegates to UpsDomainService to persist the new UPS entity.
 * - Returns the created UpsDto including generated ID.
 *
 * @param dto  CreateUpsDto containing UPS details.
 * @returns    Promise<UpsDto> the newly created UPS DTO.
 *
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const newUps = await createUpsUseCase.execute({ model:'APC123', capacity:500, roomId:'room-1' });
 */

@Injectable()
export class CreateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsDomainService: UpsDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(dto: UpsCreationDto, userId?: string): Promise<UpsResponseDto> {
    const entity =
      await this.upsDomainService.createUpsEntityFromCreateDto(dto);
    const saved = await this.upsRepository.save(entity);

    const ups = Array.isArray(saved) ? saved[0] : saved;
    await this.logHistory?.execute('ups', ups.id, 'CREATE', userId);
    return new UpsResponseDto(ups);
  }
}
