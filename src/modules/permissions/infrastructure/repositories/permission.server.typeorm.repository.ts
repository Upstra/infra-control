import { DataSource, Repository } from 'typeorm';
import { PermissionServer } from '../../domain/entities/permission.server.entity';
import { PermissionRepositoryInterface } from '../../domain/interfaces/permission.repository.interface';
import { Injectable } from '@nestjs/common';
import { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class PermissionServerTypeormRepository
  extends Repository<PermissionServer>
  implements PermissionRepositoryInterface
{
  constructor(private readonly dataSource: DataSource) {
    super(PermissionServer, dataSource.createEntityManager());
  }

  async findAll(): Promise<Permission[]> {
    throw new Error('Method not implemented.');
  }

  async findPermissionById(id: string): Promise<Permission> {
    throw new Error('Method not implemented.');
  }

  async createPermission(
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission> {
    throw new Error('Method not implemented.');
  }

  async updatePermission(
    id: string,
    name: string,
    ip: string,
    login: string,
    password: string,
  ): Promise<Permission> {
    throw new Error('Method not implemented.');
  }

  async deletePermission(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
