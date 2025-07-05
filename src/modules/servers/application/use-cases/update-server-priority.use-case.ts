import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../domain/entities/server.entity';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

@Injectable()
export class UpdateServerPriorityUseCase {
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  async execute(
    serverId: string,
    priority: number,
    userId: string,
  ): Promise<{ id: string; priority: number }> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server with id "${serverId}" not found`);
    }

    server.priority = priority;

    await this.serverRepository.save(server);
    await this.logHistory.execute('server', server.id, 'UPDATE', userId);

    return {
      id: server.id,
      priority: server.priority,
    };
  }
}