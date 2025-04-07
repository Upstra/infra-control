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
import { RoomDto } from '../dto/room.dto';
import { RoomEndpointInterface } from '@/modules/rooms/application/interfaces/room.endpoint.interface';

@Controller('room')
export class RoomController implements RoomEndpointInterface {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getAllRooms(): Promise<RoomDto[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  async getRoomById(@Param('id', ParseUUIDPipe) id: string): Promise<RoomDto> {
    return this.roomService.getRoomById(id);
  }

  @Post()
  async createRoom(@Body() roomDto: RoomDto): Promise<RoomDto> {
    return this.roomService.createRoom(roomDto);
  }

  @Patch(':id')
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roomDto: RoomDto,
  ): Promise<RoomDto> {
    return this.roomService.updateRoom(id, roomDto);
  }

  @Delete(':id')
  async deleteRoom(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomService.deleteRoom(id);
  }
}
