import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerEndpointInterface } from '@/modules/servers/application/interfaces/server.endpoint.interface';
import { ServerUpdateDto } from '@/modules/servers/application/dto/server.update.dto';
import { ServerNotFoundException } from '@/modules/servers/domain/exceptions/server.notfound.exception';
import { IloService } from '@/modules/ilos/application/services/ilo.service';

@Injectable()
export class ServerService implements ServerEndpointInterface {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly iloService: IloService,
  ) {}

  async getAllServers(): Promise<ServerResponseDto[]> {
    try {
      const servers = await this.serverRepository.findAll();
      return servers.map((server) => new ServerResponseDto(server, server.ilo));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getServerById(id: string): Promise<ServerResponseDto> {
    try {
      const server = await this.serverRepository.findServerById(id);
      return new ServerResponseDto(server, server.ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createServer(serverDto: ServerCreationDto): Promise<ServerResponseDto> {
    try {
      const server = await this.serverRepository.createServer(
        serverDto.name,
        serverDto.state,
        serverDto.grace_period_on,
        serverDto.grace_period_off,
        serverDto.ip,
        serverDto.login,
        serverDto.password,
        serverDto.type,
        serverDto.priority,
        serverDto.groupId,
        serverDto.roomId,
        serverDto.upsId,
      );
      serverDto.ilo.id = server.id;
      const ilo = await this.iloService.createIlo(serverDto.ilo);
      return new ServerResponseDto(server, ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateServer(
    id: string,
    serverDto: ServerUpdateDto,
  ): Promise<ServerResponseDto> {
    try {
      const server = await this.serverRepository.updateServer(
        id,
        serverDto.name,
        serverDto.state,
        serverDto.grace_period_on,
        serverDto.grace_period_off,
        serverDto.ip,
        serverDto.login,
        serverDto.password,
        serverDto.type,
        serverDto.priority,
        serverDto.groupId,
        serverDto.roomId,
        serverDto.upsId,
      );
      const ilo = await this.iloService.updateIlo(id, serverDto.ilo);
      return new ServerResponseDto(server, ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteServer(id: string): Promise<void> {
    try {
      await this.serverRepository.deleteServer(id);
      await this.iloService.deleteIlo(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof ServerNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
