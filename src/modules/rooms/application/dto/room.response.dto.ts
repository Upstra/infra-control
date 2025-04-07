import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Room } from '@/modules/rooms/domain/entities/room.entity';

export class RoomResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  constructor(room: Room) {
    this.id = room.id;
    this.name = room.name;
  }
}
