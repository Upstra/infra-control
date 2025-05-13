import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto';

@Injectable()
export class GetRoomByIdUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async execute(id: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findRoomById(id);
    return RoomResponseDto.from(room);
  }
}
