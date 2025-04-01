import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomDomainService {
  hello(): string {
    return 'Hello from Room Domain Service';
  }
}
