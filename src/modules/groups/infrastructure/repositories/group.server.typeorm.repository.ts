import { Injectable } from '@nestjs/common';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GroupServerTypeormRepository
  extends Repository<GroupServer>
  implements GroupRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(GroupServer, dataSource.createEntityManager());
  }

  async findAll(): Promise<GroupServer[]> {
    return await this.find({
      relations: ['servers'],
    });
  }

  async findGroupById(id: number): Promise<GroupServer | null> {
    return await this.findOne({
      where: { id },
      relations: ['servers'],
    });
  }

  async createGroup(name: string, priority: number): Promise<GroupServer> {
    const group = this.create({
      name,
      priority,
    });
    return await this.save(group);
  }

  async updateGroup(
    id: number,
    name: string,
    priority: number,
  ): Promise<GroupServer> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new Error('Group not found');
    }
    group.name = name;
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
