import { DataSource, Repository } from 'typeorm';
import { PermissionVm } from '../../domain/entities/permission.vm.entity';
import { PermissionRepositoryInterface } from '../interfaces/permission.repository.interface';
import { Injectable } from '@nestjs/common';
import { PermissionNotFoundException } from '../../domain/exceptions/permission.exception';

@Injectable()
export class PermissionVmRepository
  extends Repository<PermissionVm>
  implements PermissionRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(PermissionVm, dataSource.createEntityManager());
  }

  async findAllByRole(roleId: string): Promise<PermissionVm[]> {
    return await this.find({
      where: { roleId },
    });
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
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<PermissionVm> {
    const permission = this.create({
      vmId,
      roleId,
      allowWrite,
      allowRead,
    });
    return await this.save(permission);
  }

  async updatePermission(
    vmId: string,
    roleId: string,
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<PermissionVm> {
    const permission = await this.findPermissionByIds(vmId, roleId);
    permission.allowWrite = allowWrite;
    permission.allowRead = allowRead;
    await this.save(permission);
    return permission;
  }

  async deletePermission(vmId: string, roleId: string): Promise<void> {
    await this.findPermissionByIds(vmId, roleId);
    await this.delete({ vmId, roleId });
  }
}
