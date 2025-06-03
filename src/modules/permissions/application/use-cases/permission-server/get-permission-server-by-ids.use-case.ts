import { Inject, Injectable } from '@nestjs/common';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

@Injectable()
export class GetPermissionServerByIdsUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
  ) {}

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
