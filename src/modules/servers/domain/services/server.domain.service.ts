import { Injectable } from '@nestjs/common';
import { ServerCreationDto } from '../../application/dto/server.creation.dto';
import { Server } from '../entities/server.entity';

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
}
