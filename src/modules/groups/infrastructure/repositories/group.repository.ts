import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Group } from '../../domain/entities/group.entity';
import { GroupType } from '../../domain/enums/group-type.enum';
import {
  IGroupRepository,
  PaginationOptions,
  PaginatedResult,
  GroupWithCounts,
} from '../../domain/interfaces/group.repository.interface';

@Injectable()
export class GroupRepository implements IGroupRepository {
  constructor(
    @InjectRepository(Group)
    private readonly repository: Repository<Group>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(type?: GroupType): Promise<Group[]> {
    const query = this.repository
      .createQueryBuilder('group')
      .where('group.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('group.type = :type', { type });
    }

    return query.orderBy('group.name', 'ASC').getMany();
  }

  async findAllWithCounts(type?: GroupType): Promise<GroupWithCounts[]> {
    const query = this.repository
      .createQueryBuilder('group')
      .where('group.isActive = :isActive', { isActive: true })
      .leftJoin('group.servers', 'server')
      .leftJoin('group.vms', 'vm')
      .select('group')
      .addSelect('COUNT(DISTINCT server.id)', 'serverCount')
      .addSelect('COUNT(DISTINCT vm.id)', 'vmCount')
      .groupBy('group.id');

    if (type) {
      query.andWhere('group.type = :type', { type });
    }

    const result = await query.orderBy('group.name', 'ASC').getRawAndEntities();

    return result.entities.map((group, index) => {
      const raw = result.raw[index];
      const groupWithCounts: GroupWithCounts = {
        ...group,
        serverCount: parseInt(raw.serverCount) || 0,
        vmCount: parseInt(raw.vmCount) || 0,
      };
      return groupWithCounts;
    });
  }

  async findAllPaginated(
    options: PaginationOptions,
  ): Promise<PaginatedResult<Group>> {
    const { page, limit, type, search } = options;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('group')
      .where('group.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('group.type = :type', { type });
    }

    if (search) {
      query.andWhere(
        '(group.name ILIKE :search OR group.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('group.name', 'ASC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllPaginatedWithCounts(
    options: PaginationOptions,
  ): Promise<PaginatedResult<GroupWithCounts>> {
    const { page, limit, type, search } = options;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('group')
      .where('group.isActive = :isActive', { isActive: true })
      .leftJoin('group.servers', 'server')
      .leftJoin('group.vms', 'vm')
      .select('group')
      .addSelect('COUNT(DISTINCT server.id)', 'serverCount')
      .addSelect('COUNT(DISTINCT vm.id)', 'vmCount')
      .groupBy('group.id');

    if (type) {
      query.andWhere('group.type = :type', { type });
    }

    if (search) {
      query.andWhere(
        '(group.name ILIKE :search OR group.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const countQuery = query.clone();
    const total = await countQuery.getCount();

    query.orderBy('group.name', 'ASC').offset(skip).limit(limit);
    const result = await query.getRawAndEntities();

    const data = result.entities.map((group, index) => {
      const raw = result.raw[index];
      const groupWithCounts: GroupWithCounts = {
        ...group,
        serverCount: parseInt(raw.serverCount) || 0,
        vmCount: parseInt(raw.vmCount) || 0,
      };
      return groupWithCounts;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<Group | null> {
    return this.repository.findOne({ where: { id, isActive: true } });
  }

  async findByIdWithCounts(id: string): Promise<GroupWithCounts | null> {
    const query = this.repository
      .createQueryBuilder('group')
      .where('group.id = :id', { id })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .leftJoin('group.servers', 'server')
      .leftJoin('group.vms', 'vm')
      .select('group')
      .addSelect('COUNT(DISTINCT server.id)', 'serverCount')
      .addSelect('COUNT(DISTINCT vm.id)', 'vmCount')
      .groupBy('group.id');

    const result = await query.getRawAndEntities();

    if (!result.entities.length) {
      return null;
    }

    const group = result.entities[0];
    const raw = result.raw[0];

    const groupWithCounts: GroupWithCounts = {
      ...group,
      serverCount: parseInt(raw.serverCount) || 0,
      vmCount: parseInt(raw.vmCount) || 0,
    };

    return groupWithCounts;
  }

  async findByName(name: string): Promise<Group | null> {
    return this.repository.findOne({ where: { name } });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.repository.count({ where: { name } });
    return count > 0;
  }

  async save(group: Group): Promise<Group> {
    return this.repository.save(group);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async executeInTransaction<T>(
    operation: (manager: any) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteWithTransaction(id: string): Promise<void> {
    return this.executeInTransaction(async (manager) => {
      const group = await manager.findOne(Group, {
        where: { id },
        relations: ['servers', 'vms'],
      });

      if (!group) {
        throw new Error(`Group with id ${id} not found`);
      }

      if (group.servers?.length > 0 || group.vms?.length > 0) {
        throw new Error('Cannot delete group with associated resources');
      }

      await manager.delete(Group, id);
    });
  }

  async batchUpdateResourcesWithTransaction(
    updates: Array<{ id: string; changes: any }>,
    entityType: 'Server' | 'Vm',
  ): Promise<void> {
    return this.executeInTransaction(async (manager) => {
      for (const { id, changes } of updates) {
        await manager.update(entityType, id, changes);
      }
    });
  }
}
