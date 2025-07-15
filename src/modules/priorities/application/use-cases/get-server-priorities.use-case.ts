import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { ServerPriorityResponseDto } from '../dto/server-priority-response.dto';
@Injectable()
export class GetServerPrioritiesUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(_userId: string): Promise<ServerPriorityResponseDto[]> {
    const servers = await this.serverRepository
      .createQueryBuilder('server')
      .where('server.type != :type', { type: 'vcenter' })
      .orderBy('server.priority', 'ASC')
      .addOrderBy('server.name', 'ASC')
      .getMany();

    return servers.map((server) => ({
      id: server.id,
      name: server.name,
      priority: server.priority,
      ipAddress: server.ip,
      state: server.state,
    }));
  }
}
