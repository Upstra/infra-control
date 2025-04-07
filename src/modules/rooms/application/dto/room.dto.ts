import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RoomDto {
  @ApiProperty()
  @IsString()
  name: string;
}
