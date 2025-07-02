import { Injectable, Inject } from '@nestjs/common';
import { SetupProgressRepositoryInterface } from '../../domain/interfaces/setup.repository.interface';

/**
 * Retrieves the list of individual setup steps and their completion status.
 *
 * Responsibilities:
 * - Fetch all setup progress records via SetupProgressRepository.
 * - Map each record to SetupProgressDto containing step identifier and completed flag.
 *
 * @returns Promise<SetupProgressDto[]> array of setup steps with their completion state.
 *
 * @remarks
 * Used by dashboard and setup UIs to render progress indicators; read-only operation.
 *
 * @example
 * const steps = await getSetupProgressUseCase.execute();
 */

@Injectable()
export class GetSetupProgressUseCase {
  constructor(
    @Inject('SetupProgressRepositoryInterface')
    private readonly setupProgressRepo: SetupProgressRepositoryInterface,
  ) {}

  async execute() {
    return this.setupProgressRepo.findAll();
  }
}
