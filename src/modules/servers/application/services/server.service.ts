import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerEndpointInterface } from '../interfaces/server.endpoint.interface';
import { ServerUpdateDto } from '../dto/server.update.dto';
import { ServerNotFoundException } from '../../domain/exceptions/server.notfound.exception';
import { ServerDomainService } from '../../domain/services/server.domain.service';
import {
  DeleteIloUseCase,
  UpdateIloUseCase,
  CreateIloUseCase,
} from '@/modules/ilos/application/use-cases/';

@Injectable()
export class ServerService implements ServerEndpointInterface {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly createIloUsecase: CreateIloUseCase,
    private readonly updateIloUsecase: UpdateIloUseCase,
    private readonly deleteIloUsecase: DeleteIloUseCase,
    private readonly serverDomain: ServerDomainService,
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
      const serverEntity =
        this.serverDomain.createServerEntityFromDto(serverDto);
      const server = await this.serverRepository.save(serverEntity);
      const ilo = await this.createIloUsecase.execute(serverDto.ilo);
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
      const serverExists = await this.serverRepository.findServerById(id);
      const entity = this.serverDomain.updateServerEntityFromDto(
        serverExists,
        serverDto,
      );

      const server = await this.serverRepository.save(entity);
      const ilo = await this.updateIloUsecase.execute(id, serverDto.ilo);
      return new ServerResponseDto(server, ilo);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteServer(id: string): Promise<void> {
    try {
      await this.serverRepository.deleteServer(id);
      await this.deleteIloUsecase.execute(id);
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
