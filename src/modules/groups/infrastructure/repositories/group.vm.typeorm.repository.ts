import { Injectable } from '@nestjs/common';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { GroupVmRepositoryInterface } from '../../domain/interfaces/group-vm.repository.interface';
import { DataSource, Repository } from 'typeorm';
import { FindOneByFieldOptions } from '@/core/utils/find-one-by-field-options';

@Injectable()
export class GroupVmTypeormRepository
  extends Repository<GroupVm>
  implements GroupVmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(GroupVm, dataSource.createEntityManager());
  }
  async findOneByField<K extends keyof GroupVm>({
    field,
    value,
    disableThrow = false,
    relations = ['vms'],
  }: FindOneByFieldOptions<GroupVm, K>): Promise<GroupVm | null> {
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
      throw new GroupNotFoundException('vm', JSON.stringify(value));
    }
  }
  async findAll(): Promise<GroupVm[]> {
    return await this.find({
      relations: ['vms'],
    });
  }

  async findGroupById(id: string): Promise<GroupVm | null> {
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
    id: string,
    name: string,
    priority: number,
  ): Promise<GroupVm> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new GroupNotFoundException('vm', id);
    }
    group.name = name;
    group.priority = priority;
    return await this.save(group);
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.findGroupById(id);
    if (!group) {
      throw new GroupNotFoundException('vm', id);
    }
    await this.delete(id);
  }
}
