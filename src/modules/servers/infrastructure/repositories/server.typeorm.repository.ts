import { Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';

@Injectable()
export class ServerTypeormRepository implements ServerRepositoryInterface {
  hello(): string {
    return 'Hello from Server Repository';
  }
}
