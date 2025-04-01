import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResponseDto } from './dto/room.response.dto';
import { RoomCreationDto } from './dto/room.creation.dto';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getAllRooms(): Promise<RoomResponseDto[]> {
    return this.roomService.getAllRooms();
  }

  @Get(':id')
  async getRoomById(@Param('id') id: string): Promise<RoomResponseDto> {
    return this.roomService.getRoomById(id);
  }

  @Post()
  async createRoom(@Body() roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    return this.roomService.createRoom(roomDto);
  }

  @Patch(':id')
  async updateRoom(
    @Param('id') id: string,
    @Body() roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    return this.roomService.updateRoom(id, roomDto);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') id: string): Promise<void> {
    return this.roomService.deleteRoom(id);
  }
}
