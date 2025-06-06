import { GroupServerDto } from '../../application/dto/group.server.dto';
import { GroupServer } from '../entities/group.server.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupServerDomainService {
  createGroup(dto: GroupServerDto): GroupServer {
    const groupServer = new GroupServer();
    groupServer.name = dto.name;
    groupServer.priority = dto.priority;

    return groupServer;
  }

  updateGroupEntityFromDto(existing: GroupServer, groupDto: GroupServerDto) {
    existing.name = groupDto.name ?? existing.name;
    existing.priority = groupDto.priority ?? existing.priority;

    return existing;
  }
}
