import { Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServer } from '../../../domain/entities/permission.server.entity';
import { PermissionCreationException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class CreateReadOnlyPermissionServerUseCase {
  constructor(
    private readonly repository: PermissionServerRepository,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(): Promise<PermissionServer> {
    try {
      const entity = this.domainService.createReadOnlyPermissionEntity();
      return await this.repository.save(entity);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new PermissionCreationException(
          'Impossible de créer une permission read-only serveur.',
        );
      }
      throw new PermissionCreationException();
    }
  }
}
