import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RoomCreationDto {
  @ApiProperty({
    description: 'Nom de la salle',
    example: 'My Room',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
