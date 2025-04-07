import { Injectable, Inject } from '@nestjs/common';
import { RoomRepositoryInterface } from '../domain/interfaces/room.repository.interface';
import { RoomDto } from './dto/room.dto';

@Injectable()
export class RoomService {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async getAllRooms(): Promise<RoomDto[]> {
    return null;
  }

  async getRoomById(id: string): Promise<RoomDto> {
    return null;
  }

  async createRoom(roomDto: RoomDto): Promise<RoomDto> {
    return null;
  }

  async updateRoom(id: string, roomDto: RoomDto): Promise<RoomDto> {
    return null;
  }

  async deleteRoom(id: string): Promise<void> {
    return null;
  }
}
