import { DataSource, Repository } from 'typeorm';
import { PermissionServer } from '../../domain/entities/permission.server.entity';
import { PermissionRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.repository.interface';
import { Injectable } from '@nestjs/common';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';

@Injectable()
export class PermissionServerRepository
  extends Repository<PermissionServer>
  implements PermissionRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(PermissionServer, dataSource.createEntityManager());
  }

  async findAllByRole(roleId: string): Promise<PermissionServer[]> {
    return await this.find({
      where: { roleId },
    });
  }

  async findPermissionByIds(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServer> {
    const permission = await this.findOne({
      where: { serverId, roleId },
    });
    if (!permission) {
      throw new PermissionNotFoundException();
    }
    return permission;
  }

  async createPermission(
    serverId: string,
    roleId: string,
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<PermissionServer> {
    const permission = this.create({
      serverId,
      roleId,
      allowWrite,
      allowRead,
    });
    return await this.save(permission);
  }

  async updatePermission(
    serverId: string,
    roleId: string,
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<PermissionServer> {
    const permission = await this.findPermissionByIds(serverId, roleId);
    permission.allowWrite = allowWrite;
    permission.allowRead = allowRead;
    await this.save(permission);
    return permission;
  }

  async deletePermission(serverId: string, roleId: string): Promise<void> {
    await this.findPermissionByIds(serverId, roleId);
    await this.delete({ serverId, roleId });
  }
}
