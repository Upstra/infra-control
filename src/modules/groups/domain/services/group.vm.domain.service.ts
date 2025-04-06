import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupVmDomainService {
  hello(): string {
    return 'Hello from Group Domain Service';
  }
}
