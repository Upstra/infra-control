import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerEndpointInterface } from '../interfaces/server.endpoint.interface';
import { ServerUpdateDto } from '../dto/server.update.dto';
import { IloService } from '../../../ilos/application/services/ilo.service';
import { ServerDomainService } from '../../domain/services/server.domain.service';

@Injectable()
export class ServerService implements ServerEndpointInterface {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly iloService: IloService,
    private readonly serverDomain: ServerDomainService,
  ) {}

  async getAllServers(): Promise<ServerResponseDto[]> {
    const servers = await this.serverRepository.findAll();
    return servers.map((server) => new ServerResponseDto(server, server.ilo));
  }

  async getServerById(id: string): Promise<ServerResponseDto> {
    const server = await this.serverRepository.findServerById(id);
    return new ServerResponseDto(server, server.ilo);
  }

  async createServer(serverDto: ServerCreationDto): Promise<ServerResponseDto> {
    const serverEntity = this.serverDomain.createServerEntityFromDto(serverDto);
    const server = await this.serverRepository.save(serverEntity);
    const ilo = await this.iloService.createIlo(serverDto.ilo);
    return new ServerResponseDto(server, ilo);
  }

  async updateServer(
    id: string,
    serverDto: ServerUpdateDto,
  ): Promise<ServerResponseDto> {
    const serverExists = await this.serverRepository.findServerById(id);
    const entity = this.serverDomain.updateServerEntityFromDto(
      serverExists,
      serverDto,
    );

    const server = await this.serverRepository.save(entity);
    const ilo = await this.iloService.updateIlo(id, serverDto.ilo);
    return new ServerResponseDto(server, ilo);
  }

  async deleteServer(id: string): Promise<void> {
    await this.serverRepository.deleteServer(id);
    await this.iloService.deleteIlo(id);
  }
}
