import { Inject, Injectable } from '@nestjs/common';
import { PermissionServiceInterface } from '../interfaces/permission.service.interface';
import { PermissionVmDto } from '../dto/permission.vm.dto';
import { PermissionRepositoryInterface } from '../../domain/interfaces/permission.repository.interface';

@Injectable()
export class PermissionVmService implements PermissionServiceInterface {
  constructor(
    @Inject('PermissionRepositoryInterface')
    private readonly permissionRepository: PermissionRepositoryInterface,
  ) {}

  getAllPermissions(): Promise<PermissionVmDto[]> {
    throw new Error('Method not implemented.');
  }

  getPermissionById(id: string): Promise<PermissionVmDto> {
    throw new Error('Method not implemented.');
  }

  createPermission(permissionDto: PermissionVmDto): Promise<PermissionVmDto> {
    throw new Error('Method not implemented.');
  }

  updatePermission(
    id: string,
    permissionDto: PermissionVmDto,
  ): Promise<PermissionVmDto> {
    throw new Error('Method not implemented.');
  }

  deletePermission(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
