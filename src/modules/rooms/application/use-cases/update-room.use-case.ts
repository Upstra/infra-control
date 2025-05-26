import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto, RoomCreationDto } from '../dto';

@Injectable()
export class UpdateRoomUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(id: string, dto: RoomCreationDto): Promise<RoomResponseDto> {
    const room = await this.roomRepository.updateRoom(id, dto.name);
    return RoomResponseDto.from(room);
  }
}
