import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { Room } from '@/modules/rooms/domain/entities/room.entity';

export class RoomResponseDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  constructor(room: Room) {
    this.id = room.id;
    this.name = room.name;
  }
}
