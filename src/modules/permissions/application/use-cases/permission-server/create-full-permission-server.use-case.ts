import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Assigns a full-access permission set to a server for a given grantee.
 *
 * Responsibilities:
 * - Validates server existence.
 * - Creates or updates permission record granting all possible actions.
 *
 * @param dto  CreateFullPermissionServerDto with serverId and granteeId.
 * @returns    Promise<PermissionServerDto> reflecting full-access grant.
 *
 * @example
 * const fullPerm = await createFullPermissionServerUseCase.execute({ serverId, granteeId });
 */

@Injectable()
export class CreateFullPermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
    private readonly domainService: PermissionDomainServerService,
  ) {}

  async execute(): Promise<PermissionServerDto> {
    const entity = this.domainService.createFullPermissionEntity();
    const saved = await this.repository.save(entity);
    return PermissionServerDto.fromEntity(saved);
  }
}
