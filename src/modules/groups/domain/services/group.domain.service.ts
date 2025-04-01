import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupDomainService {
  hello(): string {
    return 'Hello from Group Domain Service';
  }
}
