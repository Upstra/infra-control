import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionNotFoundException } from '../../../domain/exceptions/permission.exception';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class GetPermissionServerByIdsUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServerDto> {
    try {
      const permission = await this.repository.findPermissionByIds(
        serverId,
        roleId,
      );
      return new PermissionServerDto(permission);
    } catch (error) {
      if (error instanceof PermissionNotFoundException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new PermissionNotFoundException(
          `Erreur lors de la récupération de la permission avec le serveur ${serverId} et le rôle ${roleId}.`,
        );
      }

      throw new PermissionNotFoundException(
        'Une erreur inconnue est survenue.',
      );
    }
  }
}
