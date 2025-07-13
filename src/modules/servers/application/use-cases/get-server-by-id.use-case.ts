import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { ServerResponseDto } from '../dto/server.response.dto';

/**
 * Fetches detailed information for one server by its identifier.
 *
 * Responsibilities:
 * - Validates server ID and user permission via PermissionDomainServerService.
 * - Retrieves the server aggregate (including VMs, iLO status) from ServerDomainService.
 * - Converts the aggregate to ServerDetailDto for the client.
 *
 * @param id      UUID of the target server.
 * @param userId  UUID of the requesting user (for permission check).
 * @returns       Promise<ServerDetailDto> full server details.
 *
 * @throws NotFoundException if the server is not found.
 * @throws UnauthorizedException if the user lacks access rights.
 *
 * @example
 * const server = await getServerByIdUseCase.execute('srv-uuid', 'user-uuid');
 */

@Injectable()
export class GetServerByIdUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<ServerResponseDto> {
    const server = await this.serverRepository.findServerById(id, [
      '

    );
    return new ServerResponseDto(server, server.ilo);
  }
}
