import { Injectable } from '@nestjs/common';
import { Group } from '../../domain/entities/group.entity';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GroupTypeormRepository
  extends Repository<Group>
  implements GroupRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(Group, dataSource.createEntityManager());
  }

  async findAll(): Promise<Group[]> {
    return await this.find({
      relations: ['servers', 'vms'],
    });
  }

  async findGroupById(id: number): Promise<Group | null> {
    return await this.findOne({
      where: { id },
      relations: ['servers', 'vms'],
    });
  }

  async createGroup(type: string, priority: number): Promise<Group> {
    const group = this.create({
      type,
      priority,
      servers: [],
      vms: [],
    });
    return await this.save(group);
  }

  async updateGroup(
    id: number,
    type: string,
    priority: number,
  ): Promise<Group> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new Error('Group not found');
    }
    group.type = type;
    group.priority = priority;
    return await this.save(group);
  }

  async deleteGroup(id: number): Promise<void> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new Error('Group not found');
    }
    await this.delete(id);
  }
}
