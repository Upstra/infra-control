import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { UpsNotFoundException } from '../../domain/exceptions/ups.exception';

/**
 * Fetches details for a single UPS device by its unique identifier.
 *
 * Responsibilities:
 * - Validates the provided UPS ID.
 * - Uses UpsDomainService to retrieve the entity.
 * - Converts the entity into UpsDto.
 *
 * @param id  UUID of the UPS device to retrieve.
 * @returns   Promise<UpsDto> the corresponding UPS DTO.
 *
 * @throws NotFoundException if no UPS matches the given ID.
 *
 * @example
 * const ups = await getUpsByIdUseCase.execute('ups-uuid-123');
 */

@Injectable()
export class GetUpsByIdUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(id: string): Promise<UpsResponseDto> {
    const result = await this.upsRepository.findByIdWithServerCount(id);
    if (!result) {
      throw new UpsNotFoundException(id);
    }
    const serverCount =
      result.ups.servers && result.ups.servers.length > 0
        ? result.ups.servers.length
        : result.serverCount;
    return new UpsResponseDto(result.ups, serverCount);
  }
}
