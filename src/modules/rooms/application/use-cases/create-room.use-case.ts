import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomCreationDto } from '../dto/room.creation.dto';
import { RoomCreationException } from '../../domain/exceptions/room.exception';

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(dto: RoomCreationDto): Promise<RoomResponseDto> {
    try {
      const room = await this.roomRepository.createRoom(dto.name);
      return new RoomResponseDto(room);
    } catch (error) {
      throw new RoomCreationException(
        `Impossible de créer la salle : ${error.message}`,
      );
    }
  }
}
