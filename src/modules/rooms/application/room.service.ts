import { Injectable, Inject } from '@nestjs/common';
import { RoomRepositoryInterface } from '../domain/interfaces/room.repository.interface';

@Injectable()
export class RoomService {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  create() {
    return this.roomRepository.hello();
  }
}
