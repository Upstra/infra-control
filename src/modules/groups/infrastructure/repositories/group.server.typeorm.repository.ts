import { Injectable } from '@nestjs/common';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { GroupServerRepositoryInterface } from '../../domain/interfaces/group-server.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { FindOneByFieldOptions } from '@/core/utils/index';
import { GroupNotFoundException } from '../../domain/exceptions/group.exception';

@Injectable()
export class GroupServerTypeormRepository
  extends Repository<GroupServer>
  implements GroupServerRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(GroupServer, dataSource.createEntityManager());
  }

  async findAll(
    relations: string[] = ['servers'],
    filters?: { roomId?: string; priority?: number },
  ): Promise<GroupServer[]> {
    const queryBuilder = this.createQueryBuilder('group');

    relations.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(`group.${relation}`, relation);
    });

    if (filters?.roomId) {
      queryBuilder.where('group.roomId = :roomId', { roomId: filters.roomId });
    }

    if (filters?.priority) {
      queryBuilder.andWhere('group.priority = :priority', {
        priority: filters.priority,
      });
    }

    return await queryBuilder.getMany();
  }

  async findOneByField<K extends keyof GroupServer>({
    field,
    value,
    disableThrow = false,
    relations = ['servers'],
  }: FindOneByFieldOptions<GroupServer, K>): Promise<GroupServer | null> {
    if (value === undefined || value === null) {
      throw new Error(`Invalid value for ${String(field)}`);
    }
    try {
      return await this.findOneOrFail({
        where: { [field]: value } as any,
        relations,
      });
    } catch {
      if (disableThrow) return null;
      throw new GroupNotFoundException('server', JSON.stringify(value));
    }
  }

  async findGroupById(id: string): Promise<GroupServer | null> {
    return await this.findOne({ where: { id }, relations: ['servers'] });
  }

  async createGroup(name: string, priority: number): Promise<GroupServer> {
    const group = this.create({ name, priority });
    return await this.save(group);
  }
  async updateGroup(
    id: string,
    name: string,
    priority: number,
  ): Promise<GroupServer> {
    const group = await this.findGroupById(id);
    if (!group) throw new GroupNotFoundException('server', id);
    group.name = name;
    group.priority = priority;
    return await this.save(group);
  }
  async deleteGroup(id: string): Promise<void> {
    const group = await this.findGroupById(id);
    if (!group) throw new GroupNotFoundException('server', id);
    await this.delete(id);
  }
}
