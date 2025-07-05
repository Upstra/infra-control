import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { SwapServerResponseDto } from '../dto/swap-response.dto';
import { GetUserServerPermissionsUseCase } from '../../../permissions/application/use-cases/permission-server';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { SwapPrioritiesBaseUseCase } from './base/swap-priorities-base.use-case';

@Injectable()
export class SwapServerPrioritiesUseCase extends SwapPrioritiesBaseUseCase<
  Server,
  { serverId?: string; bitmask: number },
  SwapServerResponseDto
> {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly getUserPermissionServer: GetUserServerPermissionsUseCase,
    protected readonly logHistory: LogHistoryUseCase,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource, logHistory);
  }

  protected getEntityRepository(): Repository<Server> {
    return this.serverRepository;
  }

  protected getEntityName(): string {
    return 'Server';
  }

  protected getEntityNamePlural(): string {
    return 'servers';
  }

  protected async getUserPermissions(userId: string) {
    return this.getUserPermissionServer.execute(userId);
  }

  protected getPermissionId(permission: {
    serverId?: string;
    bitmask: number;
  }): string {
    return permission.serverId ?? '';
  }

  protected getLogMetadata(
    _entity: Server,
    _swapPartner: Server,
  ): Record<string, any> {
    return {};
  }

  protected formatResult(
    entity1: Server,
    entity2: Server,
  ): SwapServerResponseDto {
    return {
      server1: { id: entity1.id, priority: entity1.priority },
      server2: { id: entity2.id, priority: entity2.priority },
    };
  }
}
