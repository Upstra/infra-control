import { Injectable, Logger } from '@nestjs/common';
import { Server } from '../../domain/entities/server.entity';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { DataSource, In, Repository } from 'typeorm';
import {
  ServerNotFoundException,
  ServerRetrievalException,
} from '../../domain/exceptions/server.exception';
import {
  FindOneByFieldOptions,
  FindAllByFieldOptions,
} from '@/core/utils/index';
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
        where: whereClause,
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

  async findAllByFieldPaginated<T extends PrimitiveFields<Server>>(
    {
      field,
      value,
      disableThrow = false,
      relations = [],
    }: FindAllByFieldOptions<Server, T>,
    page: number,
    limit: number,
  ): Promise<[Server[], number]> {
    if (value === undefined || value === null) {
      throw new InvalidQueryValueException(String(field), value);
    }

    try {
      let whereClause;

      if (Array.isArray(value)) {
        if (value.length === 0) return [[], 0];
        whereClause = { [field]: In(value as any) };
      } else {
        whereClause = { [field]: value };
      }

      return await this.findAndCount({
        where: whereClause,
        relations,
        skip: (page - 1) * limit,
        take: limit,
        order: { name: 'ASC' },
      });
    } catch (error) {
      if (disableThrow) return [[], 0];
      this.logger.error(
        `Error retrieving servers by field ${String(field)} with pagination:`,
        error,
      );
      throw new ServerRetrievalException(
        `Error retrieving servers by field ${String(field)} with pagination`,
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

  async findServerByIdWithCredentials(id: string): Promise<Server> {
    try {
      const server = await this.createQueryBuilder('server')
        .leftJoinAndSelect('server.ilo', 'ilo')
        .leftJoinAndSelect('server.group', 'group')
        .leftJoinAndSelect('server.room', 'room')
        .leftJoinAndSelect('server.ups', 'ups')
        .leftJoinAndSelect('server.vms', 'vms')
        .addSelect('server.password')
        .where('server.id = :id', { id })
        .getOne();

      if (!server) {
        throw new ServerNotFoundException(id);
      }
      return server;
    } catch (error) {
      this.logger.error(
        `Error retrieving server with credentials for id ${id}:`,
        error,
      );
      throw new ServerRetrievalException(
        `Error retrieving server with credentials for id ${id}`,
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

  async updateServer(id: string, data: Partial<Server>): Promise<Server> {
    try {
      await this.update(id, data);
      return await this.findServerById(id);
    } catch (error) {
      this.logger.error(`Error updating server with id ${id}:`, error);
      throw new ServerRetrievalException(`Error updating server with id ${id}`);
    }
  }

  async countByState(state: 'UP' | 'DOWN'): Promise<number> {
    try {
      return await this.count({
        where: { state },
      });
    } catch (error) {
      this.logger.error(`Error counting servers with state ${state}:`, error);
      throw new ServerRetrievalException(`Error counting servers by state`);
    }
  }

  async findByIloIp(iloIp: string): Promise<Server | null> {
    try {
      return await this.findOne({
        where: { ilo: { ip: iloIp } },
        relations: ['ilo'],
      });
    } catch (error) {
      this.logger.error(`Error finding server by iLO IP ${iloIp}:`, error);
      throw new ServerRetrievalException(`Error finding server by iLO IP`);
    }
  }
}
