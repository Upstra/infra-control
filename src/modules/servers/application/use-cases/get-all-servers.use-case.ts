import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerResponseDto } from '../dto/server.response.dto';

@Injectable()
export class GetAllServersUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(): Promise<ServerResponseDto[]> {
    const servers = await this.serverRepository.findAll();
    return servers.map((s) => new ServerResponseDto(s, s.ilo));
  }
}
