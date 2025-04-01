import { Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
@Injectable()
export class RoomTypeormRepository implements RoomRepositoryInterface {
  hello(): string {
    return 'Hello from Room Repository';
  }
}
