import { Injectable } from '@nestjs/common';

@Injectable()
export class SalleDomainService {
  hello(): string {
    return 'Hello from Salle Domain Service';
  }
}
