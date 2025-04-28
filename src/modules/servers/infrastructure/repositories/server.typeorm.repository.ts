import { Injectable, Logger } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, Repository } from 'typeorm';
import {
  ServerNotFoundException,
  ServerRetrievalException,
} from '../../domain/exceptions/server.exception';

@Injectable()
export class ServerTypeormRepository
  extends Repository<Server>
  implements ServerRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Server, dataSource.createEntityManager());
  }

  async findAll(): Promise<Server[]> {
    try {
      return await this.find({
        relations: ['vms'],
      });
    } catch (error) {
      Logger.error('Error retrieving servers:', error);
      throw new ServerRetrievalException('Error retrieving servers.');
    }
  }

  async findServerById(id: string): Promise<Server> {
    try {
      const server = await this.findOne({
        where: { id },
        relations: ['vms'],
      });
      if (!server) {
        throw new ServerNotFoundException(id);
      }
      return server;
    } catch (error) {
      Logger.error(`Error retrieving server with id ${id}:`, error);
      throw new ServerRetrievalException(
        `Error retrieving server with id ${id}`,
      );
    }
  }

  async deleteServer(id: string): Promise<void> {
    await this.findServerById(id);
    try {
      await this.delete(id);
    } catch (error) {
      Logger.error(`Error deleting server with id ${id}:`, error);
      throw new ServerNotFoundException(id);
    }
  }
}
