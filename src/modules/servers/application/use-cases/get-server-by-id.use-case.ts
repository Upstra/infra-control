import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { ServerResponseDto } from '../dto/server.response.dto';

@Injectable()
export class GetServerByIdUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<ServerResponseDto> {
    const server = await this.serverRepository.findServerById(id);
    return new ServerResponseDto(server, server.ilo);
  }
}
