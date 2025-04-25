import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import {
  ServerNotFoundException,
  ServerRetrievalException,
} from '@/modules/servers/domain/exceptions/server.exception';
import { ServerResponseDto } from '../dto/server.response.dto';

@Injectable()
export class GetServerByIdUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<ServerResponseDto> {
    try {
      const server = await this.serverRepository.findServerById(id);
      return new ServerResponseDto(server, server.ilo);
    } catch (error) {
      if (error instanceof ServerNotFoundException) throw error;
      throw new ServerRetrievalException(error.message);
    }
  }
}
