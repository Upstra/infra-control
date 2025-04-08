import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RoomCreationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
