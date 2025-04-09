import { Injectable } from '@nestjs/common';
import { PermissionServer } from '../entities/permission.server.entity';
import { PermissionServerDto } from '../../application/dto/permission.server.dto';

@Injectable()
export class PermissionDomainServerService {
  createFullPermissionEntity(): PermissionServer {
    const entity = new PermissionServer();
    entity.allowRead = true;
    entity.allowWrite = true;
    return entity;
  }

  createReadOnlyPermissionEntity(): PermissionServer {
    const entity = new PermissionServer();
    entity.allowRead = true;
    entity.allowWrite = false;
    return entity;
  }

  createPermissionEntityFromDto(dto: PermissionServerDto): PermissionServer {
    const entity = new PermissionServer();
    entity.serverId = dto.serverId;
    entity.roleId = dto.roleId;
    entity.allowRead = dto.allowRead;
    entity.allowWrite = dto.allowWrite;
    return entity;
  }
}
