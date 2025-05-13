import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Room } from '../../domain/entities/room.entity';

export class RoomResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  static from(room: Room): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
    };
  }
}
