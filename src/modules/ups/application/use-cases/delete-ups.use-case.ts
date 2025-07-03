import { Inject, Injectable } from '@nestjs/common';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

/**
 * Deletes a UPS device by its unique identifier.
 *
 * Responsibilities:
 * - Verifies the UPS exists via UpsDomainService.
 * - Removes the UPS record and handles any necessary cleanup.
 *
 * @param id  UUID of the UPS to delete.
 * @returns   Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if no UPS matches the given ID.
 *
 * @remarks
 * Ensure that any dependent workflows (e.g., shutdown sequences) are handled prior to deletion.
 *
 * @example
 * await deleteUpsUseCase.execute('ups-uuid-123');
 */

@Injectable()
export class DeleteUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(id: string, userId?: string): Promise<void> {
    await this.upsRepository.findUpsById(id);
    await this.upsRepository.deleteUps(id);
    await this.logHistory?.execute('ups', id, 'DELETE', userId);
  }
}
