import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { PermissionServer } from '../../domain/entities/permission.server.entity';
import { PermissionRepositoryInterface } from '../../infrastructure/interfaces/permission.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { PermissionNotFoundException } from '../../domain/exceptions/permission.exception';

@Injectable()
export class PermissionServerRepository
  extends Repository<PermissionServer>
  implements PermissionRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(PermissionServer, dataSource.createEntityManager());
  }

  async findAllByRole(roleId: string): Promise<PermissionServer[]> {
    try {
      return await super.find({
        where: { roleId },
      });
    } catch (error) {
      Logger.error('Error retrieving permissions:', error);
      if (error instanceof QueryFailedError) {
        throw new PermissionNotFoundException(
          `Erreur lors de la récupération de la permission pour le rôle ${roleId}.`,
        );
      }
      throw new PermissionNotFoundException(
        `Error retrieving permissions for role ${roleId}}`,
      );
    }
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

  async updatePermission(
    serverId: string,
    roleId: string,
    allowWrite: boolean,
    allowRead: boolean,
  ): Promise<PermissionServer> {
    const permission = await this.findPermissionByIds(serverId, roleId);
    permission.allowWrite = allowWrite;
    permission.allowRead = allowRead;
    await super.save(permission);
    return permission;
  }

  async deletePermission(serverId: string, roleId: string): Promise<void> {
    await this.findPermissionByIds(serverId, roleId);
    await super.delete({ serverId, roleId });
  }
}
