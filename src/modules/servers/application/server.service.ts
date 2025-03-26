import { Injectable, Inject } from '@nestjs/common';
import { ServerRepositoryInterface } from '../domain/interfaces/server.repository.interface';

@Injectable()
export class ServerService {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  create() {
    return this.serverRepository.hello();
  }
}
