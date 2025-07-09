import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

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
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: PermissionServerDto,
    userId?: string,
  ): Promise<PermissionServerDto> {
    const entity = this.domainService.createPermissionEntityFromDto(dto);
    const saved = await this.repository.save(entity);

    await this.logHistory?.executeStructured({
      entity: 'permission_server',
      entityId: `${saved.serverId}_${saved.roleId}`,
      action: 'CREATE_PERMISSION_SERVER',
      userId: userId || 'system',
      newValue: {
        serverId: saved.serverId,
        roleId: saved.roleId,
        bitmask: saved.bitmask,
      },
      metadata: {
        permissionType: 'server',
      },
    });

    return new PermissionServerDto(saved);
  }
}
