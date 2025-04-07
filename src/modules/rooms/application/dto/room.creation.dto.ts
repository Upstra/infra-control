import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RoomCreationDto {
  @ApiProperty()
  @IsString()
  name: string;
}
