import { NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import { Inject } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';
import { PermissionDomainServerService } from '@/modules/permissions/domain/services/permission.domain.server.service';
@Injectable()
export class GetServerByIdWithPermissionCheckUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
    private readonly permissionDomainService: PermissionDomainServerService,
  ) {}

  async execute(
    serverId: string,
    /*userid*/ _: string,
  ): Promise<ServerResponseDto> {
    const server = await this.serverRepo.findOneByField({
      field: 'id',
      value: serverId,
    });
    if (!server) {
      throw new NotFoundException('Server not found');
    }

    // TODO: verifier les permissions
    /*const hasAccess = await this.permissionDomainService.userHasPermission(
      userId,
      serverId,
      PermissionBit.READ,
    );*/

    /*if (!hasAccess) {
      throw new ForbiddenException('Access denied to this server');
    }*/

    return ServerResponseDto.fromEntity(server);
  }
}
