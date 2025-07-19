import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloUpdateDto } from '../dto/ilo.update.dto';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';

/**
 * Updates an existing iLO configuration for a given server.
 *
 * Responsibilities:
 * - Fetch and validate the target iLO entity via IloDomainService.
 * - Apply changes from IloUpdateDto (host, credentials, enabled flag).
 * - Persist updates and return the refreshed IloResponseDto.
 *
 * @param id   The UUID of the iLO record to update.
 * @param dto  IloUpdateDto with new host, user, password, or enablement fields.
 * @returns    Promise<IloResponseDto> reflecting the updated configuration.
 *
 * @throws NotFoundException if the iLO record does not exist.
 * @throws ValidationException if the update DTO is invalid.
 *
 * @example
 * const updatedIlo = await updateIloUseCase.execute(id, { host: '1.2.3.4' });
 */

@Injectable()
export class UpdateIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async execute(iloDto: IloUpdateDto): Promise<IloResponseDto> {
    const iloExists = await this.iloRepository.findIloByIdWithCredentials(
      iloDto.id,
    );
    const entity = this.iloDomain.updateIloEntityFromDto(iloExists, iloDto);
    const updated = await this.iloRepository.updateIlo(entity);
    return new IloResponseDto(updated);
  }
}
