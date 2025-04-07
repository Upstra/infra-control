import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Room } from '@/modules/rooms/domain/entities/room.entity';

export class RoomDto {
  @ApiProperty()
  @IsString()
  name: string;

  constructor(room: Room) {
    this.name = room.name;
  }
}
