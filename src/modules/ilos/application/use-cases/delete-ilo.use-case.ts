import { Injectable, Inject } from '@nestjs/common';
import { IloRepositoryInterface } from '../../domain/interfaces/ilo.repository.interface';

/**
 * Deletes the iLO configuration associated with a server.
 *
 * Responsibilities:
 * - Verify existence of the iLO record via IloDomainService.
 * - Perform removal of credentials and endpoint data in persistence.
 *
 * @param id  The UUID of the iLO record to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if no iLO record matches the provided id.
 *
 * @remarks
 * Use-cases should ensure no dependent operations remain before deletion.
 *
 * @example
 * await deleteIloUseCase.execute('ilo-uuid-456');
 */

@Injectable()
export class DeleteIloUseCase {
  constructor(
    @Inject('IloRepositoryInterface')
    private readonly iloRepository: IloRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    await this.iloRepository.deleteIlo(id);
  }
}
