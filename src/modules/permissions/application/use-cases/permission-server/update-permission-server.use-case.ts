import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';

@Injectable()
export class UpdatePermissionServerUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(
    serverId: string,
    roleId: string,
    dto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    const permission = await this.repository.updatePermission(
      serverId,
      roleId,
      dto.allowWrite,
      dto.allowRead,
    );
    return new PermissionServerDto(permission);
  }
}
