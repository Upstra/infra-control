import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from '../../domain/interfaces/user.repository.interface';

/**
 * Computes the total number of registered users in the system.
 *
 * Responsibilities:
 * - Delegates to UserDomainService or repository count method.
 * - Returns a simple numeric count for dashboard metrics.
 *
 * @returns Promise<number> total user count.
 *
 * @remarks
 * Used by setup and statistics use-cases to display system scale.
 *
 * @example
 * const count = await getUserCountUseCase.execute();
 */

export class GetUserCountUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(): Promise<number> {
    return this.userRepository.count();
  }
}
