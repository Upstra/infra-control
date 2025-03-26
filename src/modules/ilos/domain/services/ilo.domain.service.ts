import { Injectable } from '@nestjs/common';

@Injectable()
export class IloDomainService {
  hello(): string {
    return 'Hello from Ilo Domain Service';
  }
}
