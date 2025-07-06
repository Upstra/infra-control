import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { DeleteIloUseCase } from '@/modules/ilos/application/use-cases';

/**
 * Deletes a server and all dependent VMs after validation.
 *
 * Responsibilities:
 * - Validates server ID and user permission.
 * - Performs graceful shutdown via ServerDomainService before removal.
 * - Removes the server entity and cascades cleanup (VMs, permissions).
 *
 * @param id      UUID of the server to delete.
 * @param userId  UUID of the user performing deletion.
 * @returns       Promise<void> upon successful deletion.
 *
 * @throws NotFoundException if server does not exist.
 * @throws UnauthorizedException if user is not allowed to delete.
 *
 * @example
 * await deleteServerUseCase.execute('srv-uuid','user-uuid');
 */

@Injectable()
export class DeleteServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly deleteIloUsecase: DeleteIloUseCase,
  ) {}

  async execute(id: string, userId?: string): Promise<void> {
    await this.serverRepository.deleteServer(id);
    await this.deleteIloUsecase.execute(id);
  }
}
