import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import {
  RoomNotFoundException,
  RoomDeletionException,
} from '../../domain/exceptions/room.exception';

@Injectable()
export class DeleteRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      await this.roomRepository.deleteRoom(id);
    } catch (error) {
      if (error instanceof RoomNotFoundException) {
        throw error;
      }
      throw new RoomDeletionException(error.message);
    }
  }
}
