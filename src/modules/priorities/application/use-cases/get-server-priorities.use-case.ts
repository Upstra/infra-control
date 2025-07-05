import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { ServerPriorityResponseDto } from '../dto/server-priority-response.dto';
import { GetUserServerPermissionsUseCase } from '../../../permissions/application/use-cases/permission-server';
import { PermissionBit } from '../../../permissions/domain/value-objects/permission-bit.enum';
@Injectable()
export class GetServerPrioritiesUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly getUserPermissionServer: GetUserServerPermissionsUseCase,
  ) {}

  async execute(userId: string): Promise<ServerPriorityResponseDto[]> {
    const permissions = await this.getUserPermissionServer.execute(userId);
    
    const serverIds = permissions
      .filter(perm => (perm.bitmask & PermissionBit.READ) === PermissionBit.READ)
      .map(perm => perm.serverId);

    if (serverIds.length === 0) {
      return [];
    }

    const servers = await this.serverRepository
      .createQueryBuilder('server')
      .where('server.id IN (:...ids)', { ids: serverIds })
      .orderBy('server.priority', 'ASC')
      .addOrderBy('server.name', 'ASC')
      .getMany();

    return servers.map(server => ({
      id: server.id,
      name: server.name,
      priority: server.priority,
      ipAddress: server.ip,
      state: server.state,
    }));
  }
}