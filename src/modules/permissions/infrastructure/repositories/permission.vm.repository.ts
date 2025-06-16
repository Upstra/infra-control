import { DataSource, Repository } from 'typeorm';
import { PermissionVm } from '../../domain/entities/permission.vm.entity';
import { Injectable } from '@nestjs/common';
import { PermissionNotFoundException } from '../../domain/exceptions/permission.exception';
import { FindOneByFieldOptions } from '@/core/utils/index';
import { PermissionVmRepositoryInterface } from '../interfaces/permission.vm.repository.interface';

@Injectable()
export class PermissionVmRepository
  extends Repository<PermissionVm>
  implements PermissionVmRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(PermissionVm, dataSource.createEntityManager());
  }

  async findAllByField<K extends keyof PermissionVm>({
    field,
    value,
    disableThrow = false,
    relations = ['vms'],
  }: FindOneByFieldOptions<PermissionVm, K>): Promise<PermissionVm[]> {
    if (value === undefined || value === null) {
      throw new Error(`Invalid value for ${String(field)}`);
    }
    try {
      return await this.find({ where: { [field]: value } as any, relations });
    } catch {
      if (disableThrow) return null;
      throw new PermissionNotFoundException('vm', JSON.stringify(value));
    }
  }

  async findAll(relations?: string[]): Promise<PermissionVm[]> {
    return this.find({ relations });
  }

  async findOneByField<K extends keyof PermissionVm>({
    field,
    value,
    disableThrow = false,
    relations = ['servers'],
  }: FindOneByFieldOptions<PermissionVm, K>): Promise<PermissionVm | null> {
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
      throw new PermissionNotFoundException('vm', JSON.stringify(value));
    }
  }

  async findPermissionByIds(
    vmId: string,
    roleId: string,
  ): Promise<PermissionVm> {
    const permission = await this.findOne({
      where: { vmId, roleId },
    });
    if (!permission) {
      throw new PermissionNotFoundException();
    }
    return permission;
  }

  async createPermission(
    vmId: string,
    roleId: string,
    bitmask: number,
  ): Promise<PermissionVm> {
    const permission = this.create({
      vmId,
      roleId,
      bitmask,
    });
    return await this.save(permission);
  }

  async updatePermission(
    vmId: string,
    roleId: string,
    bitmask: number,
  ): Promise<PermissionVm> {
    const permission = await this.findPermissionByIds(vmId, roleId);
    permission.bitmask = bitmask;
    await this.save(permission);
    return permission;
  }

  async deletePermission(vmId: string, roleId: string): Promise<void> {
    await this.findPermissionByIds(vmId, roleId);
    await this.delete({ vmId, roleId });
  }
}
