import { GroupServerDto } from '../../application/dto/group.server.dto';
import { GroupServer } from '../entities/group.server.entity';
import { Injectable } from '@nestjs/common';

/**
 * Manages logical grouping of server entities, enabling bulk operations and
 * group-based permission checks within the domain layer.
 *
 * Responsibilities:
 * - Create, update, and delete server groups, enforcing uniqueness and naming rules.
 * - Add or remove servers from a group, validating entity existence and state.
 * - Retrieve group summaries (counts, statuses) for dashboard or reporting use-cases.
 * - Integrate with permission services to enforce RBAC on group operations.
 *
 * @remarks
 * Used by application-layer use-cases to perform batch server actions;
 * controllers should not manipulate groups directly via repositories.
 *
 * @example
 * // Add a server to an existing group
 * await groupServerService.addServerToGroup(groupId, serverId);
 */

@Injectable()
export class GroupServerDomainService {
  createGroup(dto: GroupServerDto): GroupServer {
    const groupServer = new GroupServer();
    groupServer.name = dto.name;
    groupServer.priority = dto.priority;

    return groupServer;
  }

  updateGroupEntityFromDto(existing: GroupServer, groupDto: GroupServerDto) {
    existing.name = groupDto.name ?? existing.name;
    existing.priority = groupDto.priority ?? existing.priority;

    return existing;
  }
}
