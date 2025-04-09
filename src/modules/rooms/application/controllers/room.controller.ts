import { ApiBody } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomEndpointInterface } from '../interfaces/room.endpoint.interface';
import { RoomCreationDto } from '../dto/room.creation.dto';

@Controller('room')
export class RoomController implements RoomEndpointInterface {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getAllRooms(): Promise<RoomResponseDto[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  async getRoomById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto> {
    return this.roomService.getRoomById(id);
  }

  @Post()
  @ApiBody({ type: RoomCreationDto, description: 'Create a new room' })
  async createRoom(@Body() roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    return this.roomService.createRoom(roomDto);
  }

  @Patch(':id')
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    return this.roomService.updateRoom(id, roomDto);
  }

  @Delete(':id')
  async deleteRoom(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomService.deleteRoom(id);
  }
}
