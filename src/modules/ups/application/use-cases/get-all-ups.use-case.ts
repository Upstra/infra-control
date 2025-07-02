import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';

/**
 * Retrieves the complete list of UPS devices in the system.
 *
 * Responsibilities:
 * - Delegates to UpsDomainService to load all UPS entities.
 * - Maps each entity to UpsDto for API output.
 *
 * @returns Promise<UpsDto[]> array of UPS device DTOs.
 *
 * @remarks
 * Read-only; used by controllers to populate UPS overview screens.
 *
 * @example
 * const upsList = await getAllUpsUseCase.execute();
 */

@Injectable()
export class GetAllUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
  ) {}

  async execute(): Promise<UpsResponseDto[]> {
    const ups = await this.upsRepository.findAll();
    return ups.map((u) => new UpsResponseDto(u));
  }
}
