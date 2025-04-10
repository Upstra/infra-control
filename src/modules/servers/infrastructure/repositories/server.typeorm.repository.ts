import { Injectable } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { ServerNotFoundException } from '../../domain/exceptions/server.notfound.exception';

@Injectable()
export class ServerTypeormRepository
  extends Repository<Server>
  implements ServerRepositoryInterface {
  constructor(private readonly dataSource: DataSource) {
    super(Server, dataSource.createEntityManager());
  }

  async findAll(): Promise<Server[]> {
    return await this.find({
      relations: ['vms'],
    });
  }

  async findServerById(id: string): Promise<Server> {
    const server = await this.findOne({
      where: { id },
      relations: ['vms'],
    });
    if (!server) {
      throw new ServerNotFoundException(id);
    }
    return server;
  }

  async deleteServer(id: string): Promise<void> {
    await this.findServerById(id);
    await this.delete(id);
  }
}
