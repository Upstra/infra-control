import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloCreationDto } from '../dto/ilo.creation.dto';
import { IloResponseDto } from '../dto/ilo.response.dto';
import { IloDomainService } from '../../domain/services/ilo.domain.service';

/**
 * Creates or registers a new iLO management endpoint for a server.
 *
 * Responsibilities:
 * - Validate the incoming DTO (host, username, password) for completeness.
 * - Delegate creation to the IloDomainService, which persists the entity.
 * - Return the created IloResponseDto with generated ID and connection metadata.
 *
 * @param dto  IloCreateDto containing serverId, host address, and credentials.
 * @returns    Promise<IloResponseDto> of the newly created iLO record.
 *
 * @throws ValidationException if required fields are missing or malformed.
 *
 * @example
 * const newIlo = await createIloUseCase.execute({ serverId, host, username, password });
 */

@Injectable()
export class CreateIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
    private readonly iloDomain: IloDomainService,
  ) {}

  async execute(iloDto: IloCreationDto): Promise<IloResponseDto> {
    const entity = this.iloDomain.createIloEntityFromDto(iloDto);
    const ilo = await this.iloRepository.save(entity);
    return new IloResponseDto(ilo);
  }
}
