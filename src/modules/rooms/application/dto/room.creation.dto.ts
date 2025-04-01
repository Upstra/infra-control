import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RoomCreationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  ip: string;

  @ApiProperty()
  @IsString()
  login: string;

  @ApiProperty()
  @IsString()
  password: string;
}
