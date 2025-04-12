import { Injectable } from '@nestjs/common';
import { ServerCreationDto } from '../../application/dto/server.creation.dto';
import { Server } from '../entities/server.entity';
import { ServerUpdateDto } from '../../application/dto/server.update.dto';

@Injectable()
export class ServerDomainService {
  createServerEntityFromDto(dto: ServerCreationDto): Server {
    const server = new Server();

    server.name = dto.name;
    server.state = dto.state;
    server.grace_period_on = dto.grace_period_on;
    server.grace_period_off = dto.grace_period_off;
    server.adminUrl = dto.adminUrl;
    server.ip = dto.ip;
    server.login = dto.login;
    server.password = dto.password;
    server.type = dto.type;
    server.priority = dto.priority;
    server.roomId = dto.roomId;
    server.groupId = dto.groupId;
    server.upsId = dto.upsId;

    return server;
  }

  updateServerEntityFromDto(server: Server, dto: ServerUpdateDto): Server {
    server.name = dto.name ?? server.name;
    server.state = dto.state ?? server.state;
    server.grace_period_on = dto.grace_period_on ?? server.grace_period_on;
    server.grace_period_off = dto.grace_period_off ?? server.grace_period_off;
    server.adminUrl = dto.adminUrl ?? server.adminUrl;
    server.ip = dto.ip ?? server.ip;
    server.login = dto.login ?? server.login;
    server.password = dto.password ?? server.password;
    server.type = dto.type ?? server.type;
    server.priority = dto.priority ?? server.priority;
    server.roomId = dto.roomId ?? server.roomId;
    server.groupId = dto.groupId ?? server.groupId;
    server.upsId = dto.upsId ?? server.upsId;

    return server;
  }
}
