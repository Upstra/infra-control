import { Inject, Injectable } from '@nestjs/common';
import { PermissionServiceInterface } from '../interfaces/permission.service.interface';
import { PermissionRepositoryInterface } from '../../domain/interfaces/permission.repository.interface';
import { PermissionServerDto } from '../dto/permission.server.dto';

@Injectable()
export class PermissionServerService implements PermissionServiceInterface {
  constructor(
    @Inject('PermissionRepositoryInterface')
    private readonly permissionRepository: PermissionRepositoryInterface,
  ) {}

  getAllPermissions(): Promise<PermissionServerDto[]> {
    throw new Error('Method not implemented.');
  }

  getPermissionById(id: string): Promise<PermissionServerDto> {
    throw new Error('Method not implemented.');
  }

  createPermission(
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    throw new Error('Method not implemented.');
  }

  updatePermission(
    id: string,
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    throw new Error('Method not implemented.');
  }

  deletePermission(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
