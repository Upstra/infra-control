import { Injectable } from '@nestjs/common';

@Injectable()
export class OnduleurDomainService {
  hello(): string {
    return 'Hello from Onduleur Domain Service';
  }
}
