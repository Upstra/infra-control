import { Injectable, Inject } from '@nestjs/common';
import { ServerRepositoryInterface } from '../domain/interfaces/server.repository.interface';
import { ServerResponseDto } from './dto/server.response.dto';
import { ServerCreationDto } from './dto/server.creation.dto';

@Injectable()
export class ServerService {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async getAllServers(): Promise<ServerResponseDto[]> {
    return null;
  }

  async getServerById(id: string): Promise<ServerResponseDto> {
    return null;
  }

  async createServer(serverDto: ServerCreationDto): Promise<ServerResponseDto> {
    return null;
  }

  async updateServer(
    id: string,
    serverDto: ServerCreationDto,
  ): Promise<ServerResponseDto> {
    return null;
  }

  async deleteServer(id: string): Promise<void> {
    return null;
  }
}
