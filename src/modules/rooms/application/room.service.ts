import { Injectable, Inject } from '@nestjs/common';
import { RoomRepositoryInterface } from '../domain/interfaces/room.repository.interface';
import { RoomResponseDto } from './dto/room.response.dto';
import { RoomCreationDto } from './dto/room.creation.dto';

@Injectable()
export class RoomService {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async getAllRooms(): Promise<RoomResponseDto[]> {
    return null;
  }

  async getRoomById(id: string): Promise<RoomResponseDto> {
    return null;
  }

  async createRoom(roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    return null;
  }

  async updateRoom(
    id: string,
    roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    return null;
  }

  async deleteRoom(id: string): Promise<void> {
    return null;
  }
}
