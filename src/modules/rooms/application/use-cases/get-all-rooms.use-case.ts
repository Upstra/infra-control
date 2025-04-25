import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto/room.response.dto';

@Injectable()
export class GetAllRoomsUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.findAll();
    return rooms.map((room) => new RoomResponseDto(room));
  }
}
