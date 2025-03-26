import { Injectable } from '@nestjs/common';

@Injectable()
export class VmDomainService {
  hello(): string {
    return 'Hello from Vm Domain Service';
  }
}
