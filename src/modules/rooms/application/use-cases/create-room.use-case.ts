import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';

@Injectable()
export class CreateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(dto: RoomCreationDto): Promise<RoomResponseDto> {
    const room = await this.roomRepository.createRoom(dto.name);
    return RoomResponseDto.from(room);
  }
}
