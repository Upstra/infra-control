import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class UpdatePermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

  async execute(
    serverId: string,
    roleId: string,
    dto: PermissionServerDto,
  ): Promise<PermissionServerDto> {
    const permission = await this.repository.updatePermission(
      serverId,
      roleId,
      dto.bitmask,
    );
    return new PermissionServerDto(permission);
  }
}
