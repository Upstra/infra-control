import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleDomainService {
  hello(): string {
    return 'Hello from Role Domain Service';
  }
}
