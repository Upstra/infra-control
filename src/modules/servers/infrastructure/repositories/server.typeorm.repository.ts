import { Injectable, Logger } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, In, Repository } from 'typeorm';
import {
  ServerNotFoundException,
  ServerRetrievalException,
} from '../../domain/exceptions/server.exception';
import { FindOneByFieldOptions } from '@/core/utils/find-one-by-field-options';
import { FindAllByFieldOptions } from '@/core/utils/find-all-by-field-options';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';
import { PrimitiveFields } from '@/core/types/primitive-fields.interface';

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
        relations: ['ilo', 'group', 'room', 'ups', 'vms'],
      });
    } catch (error) {
      this.logger.error('Error retrieving servers:', error);
      throw new ServerRetrievalException('Error retrieving servers.');
    }
  }

  async findAllByField<T extends PrimitiveFields<Server>>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindAllByFieldOptions<Server, T>): Promise<Server[]> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }

    try {
      let whereClause;

      if (Array.isArray(value)) {
        if (value.length === 0) return [];
        whereClause = { [field]: In(value as any) };
      } else {
        whereClause = { [field]: value };
      }

      return await this.find({
        where: whereClause as any,
        relations,
      });
    } catch (error) {
      if (disableThrow) return [];
      this.logger.error(
        `Error retrieving servers by field ${String(field)}:`,
        error,
      );
      throw new ServerRetrievalException(
        `Error retrieving servers by field ${String(field)}`,
      );
    }
  }

  async findServerById(id: string): Promise<Server> {
    try {
      const server = await this.findOne({
        where: { id },
        relations: ['ilo', 'group', 'room', 'ups', 'vms'],
      });
      if (!server) {
        throw new ServerNotFoundException(id);
      }
      return server;
    } catch (error) {
      this.logger.error(`Error retrieving server with id ${id}:`, error);
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
      this.logger.error(`Error deleting server with id ${id}:`, error);
      throw new ServerNotFoundException(id);
    }
  }

  async findByIds(ids: string[], relations: string[] = []): Promise<Server[]> {
    if (!ids?.length) return [];

    try {
      const servers = await this.find({
        where: { id: In(ids) },
        relations,
      });

      if (servers.length < ids.length) {
        const foundIds = new Set(servers.map((s) => s.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        this.logger.warn(
          `findByIds: ${missing.length} servers not found. Missing IDs: ${missing.join(', ')}`,
        );
      }

      return servers;
    } catch (error) {
      this.logger.error('Error in findByIds:', error);
      throw new ServerRetrievalException('Error retrieving servers by IDs');
    }
  }

  async findOneByField<T extends keyof Server>({
    field,
    value,
    disableThrow = false,
    relations = [],
  }: FindOneByFieldOptions<Server, T>): Promise<Server | null> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }

    try {
      return await this.findOne({
        where: { [field]: value } as any,
        relations,
      });
    } catch (error) {
      if (disableThrow) {
        return null;
      }
      this.logger.error('Error retrieving server by field:', error);
      throw new ServerRetrievalException('Error retrieving server by field');
    }
  }
}
