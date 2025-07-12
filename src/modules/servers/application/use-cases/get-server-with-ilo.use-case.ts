import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Server } from '../../domain/entities/server.entity';

@Injectable()
export class GetServerWithIloUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(id: string): Promise<Server> {
    const server =
      await this.serverRepository.findServerByIdWithCredentials(id);

    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }

    if (!server.ilo) {
      throw new NotFoundException(
        `Server ${id} does not have an iLO configured`,
      );
    }

    return server;
  }
}
