import { Injectable, Inject } from '@nestjs/common';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomEndpointInterface } from '../interfaces/room.endpoint.interface';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomCreationDto } from '../dto/room.creation.dto';

@Injectable()
export class RoomService implements RoomEndpointInterface {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async getAllRooms(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.findAll();
    return rooms.map((room) => new RoomResponseDto(room));
  }

  async getRoomById(id: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findRoomById(id);
    return new RoomResponseDto(room);
  }

  async createRoom(roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    const room = await this.roomRepository.createRoom(roomDto.name);
    return new RoomResponseDto(room);
  }

  async updateRoom(
    id: string,
    roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    const room = await this.roomRepository.updateRoom(id, roomDto.name);
    return new RoomResponseDto(room);
  }

  async deleteRoom(id: string): Promise<void> {
    await this.roomRepository.deleteRoom(id);
  }
}
