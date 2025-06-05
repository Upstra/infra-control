import { Injectable, Logger } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, In, Repository } from 'typeorm';
import {
  ServerNotFoundException,
  ServerRetrievalException,
} from '../../domain/exceptions/server.exception';
import { FindOneByFieldOptions } from '@/modules/users/domain/interfaces/user.repository.interface';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';

@Injectable()
export class ServerTypeormRepository
  extends Repository<Server>
  implements ServerRepositoryInterface
{
  private readonly logger = new Logger(ServerTypeormRepository.name);

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

  async findByIds(ids: string[]): Promise<Server[]> {
    if (!ids?.length) return [];

    const servers = await this.findBy({ id: In(ids) });

    if (servers.length < ids.length) {
      const foundIds = new Set(servers.map((s) => s.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      this.logger.warn(
        `findByIds: ${missing.length} servers not found. Missing IDs: ${missing.join(', ')}`,
      );
    }
    return servers;
  }

  async findOneByField<T extends keyof Server>({
    field,
    value,
    disableThrow = false,
  }: FindOneByFieldOptions<Server, T>): Promise<Server | null> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }
    try {
      return await this.findOneOrFail({ where: { [field]: value } as any });
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        if (disableThrow) {
          return null;
        }
        throw new ServerNotFoundException();
      }
      Logger.error('Error retrieving server by field:', error);
      throw new ServerRetrievalException();
    }
  }
}
