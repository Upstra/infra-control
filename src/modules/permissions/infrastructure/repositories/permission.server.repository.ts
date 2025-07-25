import { DataSource, Repository } from 'typeorm';
import { PermissionServer } from '../../domain/entities/permission.server.entity';
import { Injectable, Logger } from '@nestjs/common';
import {
  PermissionInvalidValueException,
  PermissionNotFoundException,
} from '../../domain/exceptions/permission.exception';
import { FindOneByFieldOptions } from '@/core/utils/index';
import { PermissionServerRepositoryInterface } from '../interfaces/permission.server.repository.interface';

@Injectable()
export class PermissionServerRepository
  extends Repository<PermissionServer>
  implements PermissionServerRepositoryInterface
{
  private readonly logger = new Logger(PermissionServerRepository.name);

  constructor(private readonly dataSource: DataSource) {
    super(PermissionServer, dataSource.createEntityManager());
  }

  async createPermission(
    serverId: string,
    roleId: string,
    bitmask: number,
  ): Promise<PermissionServer> {
    return this.save({
      serverId,
      roleId,
      bitmask,
    });
  }

  async findAll(
    relations: string[] = ['servers'],
  ): Promise<PermissionServer[]> {
    return await this.find({ relations });
  }

  async findOneByField<K extends keyof PermissionServer>({
    field,
    value,
    disableThrow = false,
    relations = ['servers'],
  }: FindOneByFieldOptions<
    PermissionServer,
    K
  >): Promise<PermissionServer | null> {
    if (value === undefined || value === null) {
      throw new PermissionInvalidValueException(String(field));
    }
    try {
      return await this.findOneOrFail({
        where: { [field]: value } as any,
        relations,
      });
    } catch {
      if (disableThrow) return null;
      throw new PermissionNotFoundException('server', JSON.stringify(value));
    }
  }

  async findAllByField<K extends keyof PermissionServer>({
    field,
    value,
    disableThrow = false,
    relations = ['server'],
  }: FindOneByFieldOptions<PermissionServer, K>): Promise<PermissionServer[]> {
    if (value === undefined || value === null) {
      throw new PermissionInvalidValueException(String(field));
    }
    try {
      return await this.find({ where: { [field]: value } as any, relations });
    } catch {
      if (disableThrow) return [];
      throw new PermissionNotFoundException('server', JSON.stringify(value));
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
      throw new PermissionNotFoundException('server', serverId);
    }
    return permission;
  }

  async updatePermission(
    serverId: string,
    roleId: string,
    bitmask: number,
  ): Promise<PermissionServer> {
    const permission = await this.findPermissionByIds(serverId, roleId);
    permission.bitmask = bitmask;
    await super.save(permission);
    return permission;
  }

  async deletePermission(serverId: string, roleId: string): Promise<void> {
    await this.findPermissionByIds(serverId, roleId);
    await super.delete({ serverId, roleId });
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.delete({ id });
    this.logger.log(
      `Deleted server permission with id ${id}, result: ${JSON.stringify(result)}`,
    );
  }

  async deleteByRoleId(roleId: string): Promise<void> {
    const result = await this.delete({ roleId });
    this.logger.log(
      `Deleted all server permissions for role ${roleId}, result: ${JSON.stringify(result)}`,
    );
  }

  async deleteByRoleAndServerIds(
    roleId: string,
    serverIds: string[],
  ): Promise<void> {
    if (!serverIds?.length) return;

    await this.createQueryBuilder()
      .delete()
      .where('roleId = :roleId', { roleId })
      .andWhere('serverId IN (:...serverIds)', { serverIds })
      .execute();
  }
}
