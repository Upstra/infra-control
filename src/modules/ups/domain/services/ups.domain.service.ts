import { Injectable } from '@nestjs/common';

@Injectable()
export class UpsDomainService {
  hello(): string {
    return 'Hello from Ups Domain Service';
  }
}
