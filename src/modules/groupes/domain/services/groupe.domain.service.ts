import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupeDomainService {
  hello(): string {
    return 'Hello from Groupe Domain Service';
  }
}
