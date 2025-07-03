import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Grants a specific permission on a server to a user or role.
 *
 * Responsibilities:
 * - Validates target server and grantee (user or role).
 * - Persists a new permission entry specifying allowed operations.
 *
 * @param dto  CreatePermissionServerDto containing serverId, granteeId, and actions.
 * @returns    Promise<PermissionServerDto> the newly created permission record.
 *
 * @throws {ValidationException} if DTO fields are missing or invalid.
 *
 * @example
 * const perm = await createPermissionServerUseCase.execute({ serverId, granteeId, actions: ['read','restart'] });
 */

@Injectable()
export class CreatePermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(dto: PermissionServerDto): Promise<PermissionServerDto> {
    const entity = this.domainService.createPermissionEntityFromDto(dto);
    const saved = await this.repository.save(entity);
    return new PermissionServerDto(saved);
  }
}
