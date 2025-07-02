import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

/**
 * Fetches server permissions for a given list of server IDs.
 *
 * Responsibilities:
 * - Validates the array of server UUIDs.
 * - Delegates to PermissionDomainServerService to load each permission entry.
 *
 * @param serverIds  Array of server UUIDs to retrieve permissions for.
 * @returns          Promise<PermissionServerDto[]> corresponding permission DTOs.
 *
 * @throws {NotFoundException} if any server ID is invalid or missing.
 *
 * @example
 * const perms = await getPermissionServerByIdsUseCase.execute(['id1','id2']);
 */

@Injectable()
export class GetPermissionServerByIdsUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

  async execute(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServerDto> {
    const permission = await this.repository.findPermissionByIds(
      serverId,
      roleId,
    );
    return new PermissionServerDto(permission);
  }
}
