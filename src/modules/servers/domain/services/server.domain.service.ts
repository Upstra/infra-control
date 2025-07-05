import { Injectable } from '@nestjs/common';
import { ServerCreationDto } from '../../application/dto/server.creation.dto';
import { Server } from '../entities/server.entity';
import { ServerUpdateDto } from '../../application/dto/server.update.dto';

/**
 * Manages core server operations within the domain layer, including state transitions
 * (e.g. UP/DOWN), health checks, and delegation to lower-level adapters (iLO, SSH).
 *
 * This service is responsible for:
 * - Retrieving and validating server entities from the repository.
 * - Performing business rules when changing a server’s state (graceful shutdown, force restart).
 * - Invoking the ILO domain adapter for out-of-band power operations.
 * - Propagating and wrapping any infrastructure errors into domain exceptions.
 *
 * @remarks
 * This class should be used by application layer use-cases only; controllers must never
 * call repositories or adapters directly for server state changes.
 *
 * @example
 * // Gracefully shutdown a server and handle failures
 * try {
 *   await serverDomainService.shutdownServer(serverId);
 * } catch (e) {
 *   // handle DomainShutdownException
 * }
 */

@Injectable()
export class ServerDomainService {
  createServerEntityFromDto(dto: ServerCreationDto, iloId?: string): Server {
    const server = new Server();

    server.name = dto.name;
    server.state = dto.state;
    server.grace_period_on = dto.grace_period_on;
    server.grace_period_off = dto.grace_period_off;
    server.adminUrl = dto.adminUrl;
    server.ip = dto.ip;
    server.login = dto.login;
    server.password = dto.password;
    server.type = dto.type;
    server.priority = dto.priority;
    server.roomId = dto.roomId;
    server.groupId = dto.groupId;
    server.upsId = dto.upsId;
    server.iloId = iloId || dto.ilo?.id;

    return server;
  }

  updateServerEntityFromDto(server: Server, dto: ServerUpdateDto): Server {
    server.name = dto.name ?? server.name;
    server.state = dto.state ?? server.state;
    server.grace_period_on = dto.grace_period_on ?? server.grace_period_on;
    server.grace_period_off = dto.grace_period_off ?? server.grace_period_off;
    server.adminUrl = dto.adminUrl ?? server.adminUrl;
    server.ip = dto.ip ?? server.ip;
    server.login = dto.login ?? server.login;
    server.password = dto.password ?? server.password;
    server.type = dto.type ?? server.type;
    server.priority = dto.priority ?? server.priority;

    if ('roomId' in dto) server.roomId = dto.roomId;
    if ('groupId' in dto) server.groupId = dto.groupId;
    if ('upsId' in dto) server.upsId = dto.upsId;

    return server;
  }
}
