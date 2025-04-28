import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomCreationDto } from '../dto/room.creation.dto';
import { RoomResponseDto } from '../dto/room.response.dto';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(id: string, dto: RoomCreationDto): Promise<RoomResponseDto> {
    const room = await this.roomRepository.updateRoom(id, dto.name);
    return new RoomResponseDto(room);
  }
}
