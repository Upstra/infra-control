import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';

/**
 * Retrieves the full list of servers visible to the current user.
 *
 * Responsibilities:
 * - Applies permission checks to filter servers accessible by the user.
 * - Delegates to ServerDomainService to load server aggregates.
 * - Maps each server entity to ServerDto for API consumption.
 *
 * @returns Promise<ServerDto[]> array of server DTOs.
 *
 * @remarks
 * Used by controllers to display server listings; does not modify data.
 *
 * @example
 * const servers = await getAllServersUseCase.execute(userId);
 */

@Injectable()
export class GetAllServersUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(): Promise<ServerResponseDto[]> {
    const servers = await this.serverRepository.findAll();
    return servers.map((s) => new ServerResponseDto(s, s.ilo));
  }
}
