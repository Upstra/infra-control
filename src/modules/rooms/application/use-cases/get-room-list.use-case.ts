import { Inject, Injectable } from '@nestjs/common';
import { RoomRepositoryInterface } from '../..//domain/interfaces/room.repository.interface';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomListResponseDto } from '../dto/room.list.response.dto';

@Injectable()
export class GetRoomListUseCase {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly repo: RoomRepositoryInterface,
  ) {}

  async execute(page = 1, limit = 10): Promise<RoomListResponseDto> {
    const [rooms, total] = await this.repo.paginate(page, limit);
    const dtos = rooms.map((r) => RoomResponseDto.from(r));
    return new RoomListResponseDto(dtos, total, page, limit);
  }
}
