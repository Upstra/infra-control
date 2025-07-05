import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { SwapServerResponseDto } from '../dto/swap-response.dto';
import { GetUserServerPermissionsUseCase } from '../../../permissions/application/use-cases/permission-server';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { PermissionBit } from '../../../permissions/domain/value-objects/permission-bit.enum';

@Injectable()
export class SwapServerPrioritiesUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly getUserPermissionServer: GetUserServerPermissionsUseCase,
    private readonly logHistory: LogHistoryUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    server1Id: string,
    server2Id: string,
    userId: string,
  ): Promise<SwapServerResponseDto> {
    const permissions = await this.getUserPermissionServer.execute(userId);
    const permissionMap = new Map(
      permissions.map(p => [p.serverId, p.bitmask]),
    );

    const perm1 = permissionMap.get(server1Id);
    const perm2 = permissionMap.get(server2Id);

    const hasWritePermission = (bitmask: number | undefined) => 
      bitmask !== undefined && (bitmask & PermissionBit.WRITE) === PermissionBit.WRITE;

    if (!hasWritePermission(perm1) || !hasWritePermission(perm2)) {
      throw new ForbiddenException(
        'You do not have write permissions on both servers',
      );
    }

    return await this.dataSource.transaction(async manager => {
      const serverRepo = manager.getRepository(Server);

      const server1 = await serverRepo.findOne({ where: { id: server1Id } });
      const server2 = await serverRepo.findOne({ where: { id: server2Id } });

      if (!server1) {
        throw new NotFoundException(`Server with id "${server1Id}" not found`);
      }
      if (!server2) {
        throw new NotFoundException(`Server with id "${server2Id}" not found`);
      }

      const server1OriginalPriority = server1.priority;
      const server2OriginalPriority = server2.priority;

      server1.priority = server2OriginalPriority;
      server2.priority = server1OriginalPriority;

      await serverRepo.save([server1, server2]);

      await this.logHistory.executeStructured({
        entity: 'server',
        entityId: server1.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: server1OriginalPriority },
        newValue: { priority: server1.priority },
        metadata: {
          swapPartner: server2.id,
          swapPartnerName: server2.name,
          oldPriority: server1OriginalPriority,
          newPriority: server1.priority,
        },
      });

      await this.logHistory.executeStructured({
        entity: 'server',
        entityId: server2.id,
        action: 'PRIORITY_SWAP',
        userId,
        oldValue: { priority: server2OriginalPriority },
        newValue: { priority: server2.priority },
        metadata: {
          swapPartner: server1.id,
          swapPartnerName: server1.name,
          oldPriority: server2OriginalPriority,
          newPriority: server2.priority,
        },
      });

      return {
        server1: { id: server1.id, priority: server1.priority },
        server2: { id: server2.id, priority: server2.priority },
      };
    });
  }
}