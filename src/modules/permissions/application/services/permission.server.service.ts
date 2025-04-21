import { Injectable } from '@nestjs/common';
import { PermissionEndpointInterface } from '../interfaces/permission.endpoint.interface';
import { PermissionServerDto } from '../dto/permission.server.dto';
import { PermissionServerRepository } from '../../infrastructure/repositories/permission.server.repository';
import { PermissionDomainServerService } from '../../domain/services/permission.domain.server.service';
import { PermissionServer } from '../../domain/entities/permission.server.entity';

@Injectable()
export class PermissionServerService implements PermissionEndpointInterface {
  constructor(
    private readonly permissionRepository: PermissionServerRepository,
    private readonly permissionDomain: PermissionDomainServerService,
  ) {}

  async getPermissionsByRole(roleId: string): Promise<PermissionServerDto[]> {
    const permissions = await this.permissionRepository.findAllByRole(roleId);
    return permissions.map((permission) => new PermissionServerDto(permission));
  }

  async getPermissionByIds(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServerDto> {
    const permission = await this.permissionRepository.findPermissionByIds(
      serverId,
      roleId,
    );
    return new PermissionServerDto(permission);
  }

  async createPermission(
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    const entity =
      this.permissionDomain.createPermissionEntityFromDto(permissionDto);
    const saved = await this.permissionRepository.save(entity);
    return new PermissionServerDto(saved);
  }

  async updatePermission(
    serverId: string,
    roleId: string,
    permissionDto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    const permission = await this.permissionRepository.updatePermission(
      serverId,
      roleId,
      permissionDto.allowWrite,
      permissionDto.allowRead,
    );
    return new PermissionServerDto(permission);
  }

  async deletePermission(serverId: string, roleId: string): Promise<void> {
    await this.permissionRepository.deletePermission(serverId, roleId);
  }

  async createFullPermission(): Promise<PermissionServer> {
    const entity = this.permissionDomain.createFullPermissionEntity();
    const saved = await this.permissionRepository.save(entity);
    return saved;
  }

  async createReadOnlyPermission(): Promise<PermissionServer> {
    const entity = this.permissionDomain.createReadOnlyPermissionEntity();
    const saved = await this.permissionRepository.save(entity);
    return saved;
  }
}
