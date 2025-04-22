import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionCreationException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class CreatePermissionServerUseCase {
  constructor(
    private readonly repository: PermissionServerRepository,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(dto: PermissionServerDto): Promise<PermissionServerDto> {
    try {
      const entity = this.domainService.createPermissionEntityFromDto(dto);
      const saved = await this.repository.save(entity);
      return new PermissionServerDto(saved);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new PermissionCreationException(
          'Erreur lors de la création d’une permission serveur.',
        );
      }
      throw new PermissionCreationException();
    }
  }
}
