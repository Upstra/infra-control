import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionDeletionException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class DeletePermissionServerUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(serverId: string, roleId: string): Promise<void> {
    try {
      await this.repository.deletePermission(serverId, roleId);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new PermissionDeletionException('Erreur lors de la suppression.');
      }
      throw new PermissionDeletionException();
    }
  }
}
