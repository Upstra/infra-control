import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupServerDomainService {
  hello(): string {
    return 'Hello from Group Domain Service';
  }
}
