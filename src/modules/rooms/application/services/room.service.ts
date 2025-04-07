import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomEndpointInterface } from '../interfaces/room.endpoint.interface';
import { RoomNotFoundException } from '../../domain/exceptions/room.exception';
import { RoomRepositoryInterface } from '../../domain/interfaces/room.repository.interface';
import { RoomCreationDto } from '@/modules/rooms/application/dto/room.creation.dto';

@Injectable()
export class RoomService implements RoomEndpointInterface {
  constructor(
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
  ) {}

  async getAllRooms(): Promise<RoomResponseDto[]> {
    try {
      const rooms = await this.roomRepository.findAll();
      return rooms.map((room) => new RoomResponseDto(room));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getRoomById(id: string): Promise<RoomResponseDto> {
    try {
      const room = await this.roomRepository.findRoomById(id);
      return new RoomResponseDto(room);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createRoom(roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    try {
      const room = await this.roomRepository.createRoom(roomDto.name);
      return new RoomResponseDto(room);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateRoom(
    id: string,
    roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    try {
      const room = await this.roomRepository.updateRoom(id, roomDto.name);
      return new RoomResponseDto(room);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteRoom(id: string): Promise<void> {
    try {
      await this.roomRepository.deleteRoom(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  handleError(error: any): void {
    if (error instanceof RoomNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
