import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerDomainService {
  hello(): string {
    return 'Hello from Server Domain Service';
  }
}
