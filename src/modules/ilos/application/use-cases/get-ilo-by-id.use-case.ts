import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';
import { IloResponseDto } from '../dto/ilo.response.dto';

/**
 * Retrieves a single iLO configuration by its server identifier.
 *
 * Responsibilities:
 * - Fetch the iLO entity for the given server ID via the IloDomainService.
 * - Map the domain entity to its DTO representation for controller consumption.
 *
 * @param serverId  The UUID of the server whose iLO details are requested.
 * @returns         Promise<IloResponseDto> containing host, credentials, and status.
 *
 * @throws NotFoundException if no iLO record exists for the provided serverId.
 *
 * @example
 * const iloInfo = await getIloByIdUseCase.execute('server-uuid-123');
 */

@Injectable()
export class GetIloByIdUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<IloResponseDto> {
    const ilo = await this.iloRepository.findIloById(id);
    return new IloResponseDto(ilo);
  }
}
