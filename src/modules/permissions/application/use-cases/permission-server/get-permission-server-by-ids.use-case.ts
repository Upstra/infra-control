import { Injectable } from '@nestjs/common';
import { PermissionServerRepository } from '../../../infrastructure/repositories/permission.server.repository';
import { PermissionServerDto } from '../../dto/permission.server.dto';

@Injectable()
export class GetPermissionServerByIdsUseCase {
  constructor(private readonly repository: PermissionServerRepository) {}

  async execute(
    serverId: string,
    roleId: string,
  ): Promise<PermissionServerDto> {
    const permission = await this.repository.findPermissionByIds(
      serverId,
      roleId,
    );
    return new PermissionServerDto(permission);
  }
}
