import { Injectable } from '@nestjs/common';

@Injectable()
export class UserDomainService {
  hello(): string {
    return 'Hello from User Domain Service';
  }
}
