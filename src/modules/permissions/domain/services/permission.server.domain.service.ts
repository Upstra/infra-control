import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionServerDomainService {
  hello(): string {
    return 'Hello from PermissionServer Service';
  }
}
