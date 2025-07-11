import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { Server } from '../../domain/entities/server.entity';

@Injectable()
export class GetServerByIloIpUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(iloIp: string): Promise<Server> {
    const server = await this.serverRepository.findByIloIp(iloIp);

    if (!server) {
      throw new NotFoundException(`Server with iLO IP ${iloIp} not found`);
    }

    return server;
  }
}
