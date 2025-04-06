import { Injectable } from '@nestjs/common';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { GroupRepositoryInterface } from '../../domain/interfaces/group.repository.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GroupVmTypeormRepository
  extends Repository<GroupVm>
  implements GroupRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(GroupVm, dataSource.createEntityManager());
  }

  async findAll(): Promise<GroupVm[]> {
    return await this.find({
      relations: ['vms'],
    });
  }

  async findGroupById(id: number): Promise<GroupVm | null> {
    return await this.findOne({
      where: { id },
      relations: ['vms'],
    });
  }

  async createGroup(name: string, priority: number): Promise<GroupVm> {
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
  ): Promise<GroupVm> {
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
